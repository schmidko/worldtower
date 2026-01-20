// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

contract WorldTower {
    string public greeting;

    constructor() {
        greeting = "Hello WorldTower";
    }

    function setGreeting(string memory _greeting) public {
        greeting = _greeting;
    }
}
