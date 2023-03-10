// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.0;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";


contract ProjectFunder is Ownable, ReentrancyGuard {

 using SafeMath for uint256;
 //using Math for uint256;

event CreateProject(address indexed _user , string _name, uint when);
event ContributeToProject(address indexed _user ,uint amount, uint when);
event Withdraw(address indexed _user ,uint amount, uint when);
event ProjectFunded(string indexed name , uint amount, uint when);

struct Project {
    string name;
    uint deadline;
    uint256 fundingGoal;
    uint256 currentFunding;
    uint256 contributorLimit;
    bool exists;
}


 mapping( string  => Project) Projects;
 mapping( address => mapping( string => uint256)) contributions;

 IERC20 public immutable token;


constructor(address _token){

    token = IERC20(_token);

}

modifier checkAllowance(uint amount) {
    require(amount > 0, "amount cant be 0");
    require(token.allowance(msg.sender, address(this)) >= amount, "Error");
    _;
}

modifier IsNotEmptyString(string memory _str) {
    require((bytes(_str).length != 0), "Cannot accept empty string") ;
    _;
}


function createProject(string memory _name, uint _deadline, uint256 _fundingGoal,uint256 _contributorLimit ) IsNotEmptyString(_name)
         onlyOwner external returns(bool) {


    require(!Projects[_name].exists, "A project with this name already exists");
    require(_deadline  > block.timestamp.add(1 days), "Minimum deadline of 24 hours!");
    require(_fundingGoal  > 0, "Cannot set funding goal of 0 tokens");

        Project memory newProject = Project({
            name: _name,
            deadline: _deadline,
            fundingGoal: _fundingGoal,
            currentFunding: 0,
            contributorLimit : _contributorLimit,
            exists : true
        });

        Projects[_name] = newProject;

        emit CreateProject(owner(), _name, block.timestamp);

        return true;
}

function contribute(string memory _name , uint256 _amount) IsNotEmptyString(_name) checkAllowance(_amount) external returns(bool) {


      
       require(Projects[_name].exists == true, "This project doesnt exist"); // check if the project exists
       require(Projects[_name].deadline > block.timestamp, "Project deadline has already passed");// do deadline check
       require(Projects[_name].currentFunding < Projects[_name].fundingGoal , "This project has been fully funded");// check that it hasnt reached goal yet
       require(_amount > 0 , "Cannot contribute 0 tokens to this project");

       if (Projects[_name].contributorLimit > 0 ){ //this means a contributor limit was set

        // check contributer hasnt reached limit
        require(contributions[msg.sender][_name].add(_amount)  <= Projects[_name].contributorLimit , "Your exceeding the contribution limit");
        
       }

       

       token.transferFrom(msg.sender, address(this), _amount);
       contributions[msg.sender][_name] = contributions[msg.sender][_name].add(_amount);
       Projects[_name].currentFunding = Projects[_name].currentFunding.add(_amount);

       emit ContributeToProject(msg.sender, _amount, block.timestamp);
       
       
       if(Projects[_name].currentFunding == Projects[_name].fundingGoal){

            emit ProjectFunded(_name, _amount, block.timestamp);
       }

       return true;

    }

    function withdraw(string memory _name ) IsNotEmptyString(_name) nonReentrant external returns(bool) {

       require(Projects[_name].exists == true, "This project doesnt exist"); // check if the project exists
       require(Projects[_name].deadline <= block.timestamp, "Project deadline has not passed yet");// do deadline check
       require(Projects[_name].currentFunding < Projects[_name].fundingGoal , "This project was fully funded before its deadline ended");

       uint256 amount = contributions[msg.sender][_name];
       require(amount  > 0, "You did not contribute to this project");

       token.transfer(msg.sender, amount);

       contributions[msg.sender][_name] = 0;
       emit Withdraw(msg.sender, amount, block.timestamp);
       
       return true;

    }


    function getOwner() external view returns(address){
        return owner();
    }

    function getUserContributions(string memory _ProjectName, address user) external view returns(uint256){
        
        require(user != address(0), "Cant check for 0x0 address");
        return contributions[user][_ProjectName];
    }

}