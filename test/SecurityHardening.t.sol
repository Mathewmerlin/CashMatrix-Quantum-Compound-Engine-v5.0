// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import {IntentMeshRouter} from "../contracts/core/IntentMeshRouter.sol";

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
