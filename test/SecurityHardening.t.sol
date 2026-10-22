// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import {IntentMeshRouter} from "../contracts/core/IntentMeshRouter.sol";
import {CashMatrixKeeper} from "../contracts/core/KeeperBot.sol";
import {CashMatrixTimelock} from "../contracts/governance/CashMatrixTimelock.sol";
import {YieldInsurancePool} from "../contracts/security/YieldInsurancePool.sol";
import {OmniGenesis2050Master} from "../contracts/core/OmniGenesis2050Master.sol";

contract ExecutableTarget {
    uint256 public lastValue;

    function store(uint256 value) external {
        lastValue = value;
    }
}

contract IntentMeshRouterTest is Test {
    IntentMeshRouter internal router;
    ExecutableTarget internal target;

    address internal user = makeAddr("user");
    address internal solver = makeAddr("solver");
    address internal attacker = makeAddr("attacker");

    uint256 internal deadline;

    function setUp() public {
        router = new IntentMeshRouter();
        target = new ExecutableTarget();

        router.setApprovedTarget(address(target), true);
        router.setSolverAuthorization(solver, true);

        deadline = block.timestamp + 1 days;
    }

    function test_SubmitAndExecuteIntent() public {
        bytes memory payload = abi.encodeCall(
            ExecutableTarget.store,
            (42)
        );

        vm.prank(user);
        bytes32 intentHash = router.submitIntent(
            address(target),
            payload,
            deadline
        );

        vm.prank(solver);
        router.executeIntent(intentHash);

        assertEq(target.lastValue(), 42);
        (, , , , bool executed) = router.intents(intentHash);
        assertTrue(executed);
    }

    function test_RevertWhen_UnapprovedTarget() public {
        ExecutableTarget unapproved = new ExecutableTarget();
        bytes memory payload = abi.encodeCall(
            ExecutableTarget.store,
            (1)
        );

        vm.prank(user);
        vm.expectRevert("Target not approved");
        router.submitIntent(
            address(unapproved),
            payload,
            deadline
        );
    }

    function test_RevertWhen_UnauthorizedSolver() public {
        bytes memory payload = abi.encodeCall(
            ExecutableTarget.store,
            (1)
        );

        vm.prank(user);
        bytes32 intentHash = router.submitIntent(
            address(target),
            payload,
            deadline
        );

        vm.prank(attacker);
        vm.expectRevert("Not authorized solver");
        router.executeIntent(intentHash);
    }

    function test_RevertWhen_DuplicateExecution() public {
        bytes memory payload = abi.encodeCall(
            ExecutableTarget.store,
            (7)
        );

        vm.prank(user);
        bytes32 intentHash = router.submitIntent(
            address(target),
            payload,
            deadline
        );

        vm.startPrank(solver);
        router.executeIntent(intentHash);

        vm.expectRevert("Intent already executed");
        router.executeIntent(intentHash);
        vm.stopPrank();
    }

    function test_RevertWhen_IntentExpired() public {
        bytes memory payload = abi.encodeCall(
            ExecutableTarget.store,
            (9)
        );

        vm.prank(user);
        bytes32 intentHash = router.submitIntent(
            address(target),
            payload,
            deadline
        );

        vm.warp(deadline + 1);

        vm.prank(solver);
        vm.expectRevert("Intent expired");
        router.executeIntent(intentHash);
    }

    function test_RevertWhen_PayloadTooLarge() public {
        bytes memory payload = new bytes(2049);

        vm.prank(user);
        vm.expectRevert("Payload too large");
        router.submitIntent(
            address(target),
            payload,
            deadline
        );
    }
}

contract VaultMock {
    uint256 public compoundCalls;
    uint256 public lastYield;

    function compoundYield(
        uint256,
        bytes calldata
    ) external returns (uint256) {
        compoundCalls++;
        lastYield = compoundCalls * 100;
        return lastYield;
    }
}

contract CashMatrixKeeperTest is Test {
    CashMatrixKeeper internal keeper;
    VaultMock internal vault;

    address internal keeperRole = makeAddr("keeper");
    address internal attacker = makeAddr("attacker");

    function setUp() public {
        vault = new VaultMock();
        keeper = new CashMatrixKeeper(address(vault));

        keeper.grantRole(keeper.KEEPER_ROLE(), keeperRole);
    }

    function test_KeeperCanCompoundAfterInterval() public {
        vm.warp(block.timestamp + 1 hours + 1);

        vm.prank(keeperRole);
        keeper.performUpkeep("");

        assertEq(vault.compoundCalls(), 1);
        assertEq(keeper.lastCompoundTimestamp(), block.timestamp);
    }

    function test_RevertWhen_IntervalNotElapsed() public {
        vm.prank(keeperRole);
        vm.expectRevert("Compound interval not elapsed");
        keeper.performUpkeep("");
    }

    function test_RevertWhen_NotKeeper() public {
        vm.warp(block.timestamp + 1 hours + 1);

        vm.prank(attacker);
        vm.expectRevert();
        keeper.performUpkeep("");
    }

    function test_CheckUpkeepReturnsCorrectState() public {
        (bool beforeInterval, ) = keeper.checkUpkeep("");
        assertFalse(beforeInterval);

        vm.warp(block.timestamp + 1 hours + 1);

        (bool afterInterval, ) = keeper.checkUpkeep("");
        assertTrue(afterInterval);
    }

    function test_RevertWhen_InvalidVault() public {
        vm.expectRevert("Invalid vault address");
        new CashMatrixKeeper(address(0));
    }
}

contract CashMatrixTimelockTest is Test {
    CashMatrixTimelock internal timelock;

    address internal target = makeAddr("target");
    address internal attacker = makeAddr("attacker");

    uint256 internal value = 0;
    bytes internal data = "";
    uint256 internal executeTime;

    function setUp() public {
        timelock = new CashMatrixTimelock(address(this));
        executeTime = block.timestamp + 1 days + 1;
    }

    function test_QueueAndExecuteTransaction() public {
        bytes32 txHash = timelock.queueTransaction(
            target,
            value,
            data,
            executeTime
        );

        assertTrue(timelock.queuedTransactions(txHash));

        vm.warp(executeTime);

        timelock.executeTransaction(target, value, data, executeTime);

        assertFalse(timelock.queuedTransactions(txHash));
    }

    function test_RevertWhen_DelayTooShort() public {
        vm.expectRevert("Delay too short");
        timelock.queueTransaction(
            target,
            value,
            data,
            block.timestamp + 1 hours
        );
    }

    function test_RevertWhen_NotReady() public {
        timelock.queueTransaction(target, value, data, executeTime);

        vm.expectRevert("Transaction not ready");
        timelock.executeTransaction(target, value, data, executeTime);
    }

    function test_RevertWhen_NotQueued() public {
        vm.warp(executeTime);

        vm.expectRevert("Transaction not queued");
        timelock.executeTransaction(target, value, data, executeTime);
    }

    function test_RevertWhen_TransactionExpired() public {
        timelock.queueTransaction(target, value, data, executeTime);

        vm.warp(executeTime + 31 days);

        vm.expectRevert("Transaction expired");
        timelock.executeTransaction(target, value, data, executeTime);
    }

    function test_RevertWhen_DuplicateQueue() public {
        timelock.queueTransaction(target, value, data, executeTime);

        vm.expectRevert("Already queued");
        timelock.queueTransaction(target, value, data, executeTime);
    }

    function test_CancelTransaction() public {
        bytes32 txHash = timelock.queueTransaction(
            target,
            value,
            data,
            executeTime
        );

        timelock.cancelTransaction(target, value, data, executeTime);

        assertFalse(timelock.queuedTransactions(txHash));
    }

    function test_RevertWhen_NonOwnerExecutes() public {
        timelock.queueTransaction(target, value, data, executeTime);

        vm.warp(executeTime);

        vm.prank(attacker);
        vm.expectRevert();
        timelock.executeTransaction(target, value, data, executeTime);
    }
}

contract YieldInsurancePoolTest is Test {
    YieldInsurancePool internal pool;

    address internal recipient = makeAddr("recipient");
    address internal attacker = makeAddr("attacker");

    function setUp() public {
        pool = new YieldInsurancePool();
    }

    function test_DepositIncreasesReserve() public {
        vm.deal(address(this), 1 ether);

        (bool success, ) = address(pool).call{value: 1 ether}("");
        assertTrue(success);

        assertEq(pool.reserveBalance(), 1 ether);
    }

    function test_OwnerCanPayClaim() public {
        vm.deal(address(this), 1 ether);
        (bool success, ) = address(pool).call{value: 1 ether}("");
        assertTrue(success);

        uint256 recipientBalanceBefore = recipient.balance;

        pool.payoutClaim(recipient, 0.5 ether);

        assertEq(pool.reserveBalance(), 0.5 ether);
        assertEq(recipient.balance, recipientBalanceBefore + 0.5 ether);
    }

    function test_RevertWhen_InsufficientReserve() public {
        vm.expectRevert("Insufficient reserve funds");
        pool.payoutClaim(recipient, 1 ether);
    }

    function test_RevertWhen_ZeroRecipient() public {
        vm.deal(address(this), 1 ether);
        (bool success, ) = address(pool).call{value: 1 ether}("");
        assertTrue(success);

        vm.expectRevert("Invalid recipient");
        pool.payoutClaim(address(0), 0.1 ether);
    }

    function test_RevertWhen_ZeroAmount() public {
        vm.expectRevert("Zero amount");
        pool.payoutClaim(recipient, 0);
    }

    function test_RevertWhen_NonOwnerPaysClaim() public {
        vm.deal(address(this), 1 ether);
        (bool success, ) = address(pool).call{value: 1 ether}("");
        assertTrue(success);

        vm.prank(attacker);
        vm.expectRevert();
        pool.payoutClaim(attacker, 0.1 ether);
    }
}

contract MockERC20 {
    string public name = "Mock Token";
    string public symbol = "MOCK";
    uint8 public decimals = 18;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        require(allowed >= amount, "Insufficient allowance");

        allowance[from][msg.sender] = allowed - amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }
}

contract OmniGenesis2050MasterTest is Test {
    OmniGenesis2050Master internal master;
    MockERC20 internal token;

    address internal user = makeAddr("user");
    address internal attacker = makeAddr("attacker");

    function setUp() public {
        token = new MockERC20();
        master = new OmniGenesis2050Master(
            address(token),
            bytes32("initial-genome"),
            0
        );

        token.mint(address(master), 10 ether);
    }

    function test_HarvestSplitsProfitCorrectly() public {
        master.executeAutonomicHarvest(user, 1 ether);

        assertEq(master.userClaimableProfit(user), 0.5 ether);
        assertEq(master.computeTreasuryReserve(), 0.5 ether);
    }

    function test_UserCanWithdrawProfit() public {
        master.executeAutonomicHarvest(user, 1 ether);

        vm.prank(user);
        master.withdrawUserProfit(0.5 ether);

        assertEq(master.userClaimableProfit(user), 0);
        assertEq(token.balanceOf(user), 0.5 ether);
    }

    function test_RevertWhen_WithdrawExceedsClaimable() public {
        vm.prank(attacker);
        vm.expectRevert("Exceeds claimable balance");
        master.withdrawUserProfit(1 ether);
    }

    function test_RevertWhen_SplitOutOfBounds() public {
        vm.expectRevert("Split out of bounds");
        master.setSplitBasisPoints(500);

        vm.expectRevert("Split out of bounds");
        master.setSplitBasisPoints(9500);
    }

    function test_RevertWhen_MutationVerifierDisabled() public {
        vm.expectRevert("Mutation lock engaged");
        master.mutateGenome(bytes32("new-genome"), hex"1234");
    }

    function test_RevertWhen_NonOwnerHarvests() public {
        vm.prank(attacker);
        vm.expectRevert();
        master.executeAutonomicHarvest(user, 1 ether);
    }
}
