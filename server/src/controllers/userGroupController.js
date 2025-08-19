const User = require("../models/User");
const UserGroup = require("../models/UserGroup");

const defaultUserGroups = [
  { name: "Ungrouped", groupType: "undergraduate" },
  { name: "Ungrouped", groupType: "postgraduate" },
  { name: "Ungrouped", groupType: "lecturer" },
  { name: "Ungrouped", groupType: "hod" },
  { name: "Ungrouped", groupType: "cse-office" },
  { name: "Ungrouped", groupType: "admin" },
];

const initializeUserGroups = async () => {
  console.log("Initializing default user groups...");
  for (const group of defaultUserGroups) {
    const { name, groupType } = group;
    try {
      const existingGroup = await UserGroup.findOne({ name, groupType });
      if (!existingGroup) {
        const newGroup = new UserGroup({
          name,
          groupType,
          userCount: 0,
        });
        await newGroup.save();
        console.log(`Created group: ${name}`);
      } else {
        console.log(`Group already exists: ${name}`);
      }
    } catch (error) {
      console.error(`Failed to initialize group ${name}:`, error);
    }
  }
};

const createNewUsers = async (req, res) => {
  try {
    const { users, userRole, groupId } = req.body;
    let assignedGroupId;

    if (groupId === "") {
      assignedGroupId = (
        await UserGroup.findOne({ name: "Ungrouped", groupType: userRole })
      )._id.toString();
    }else{
      assignedGroupId = groupId;
    }

    if (
      userRole === "undergraduate" ||
      userRole === "postgraduate"
    ) {
      for (const user of users) {
        if (!user.indexNumber) {
          return res
            .status(400)
            .json({ message: "Index Number is required for this user type." });
        }
      }
    }

    const newUsers = users.map((user) => ({
      ...user,
      name: "Unsigned User",
      role: userRole,
      userGroup: assignedGroupId,
    }));

    // Save the new users to the database
    await User.insertMany(newUsers);
    res
      .status(201)
      .json({ message: `${users.length} ${userRole} users successfully created and added to the group.` });
  } catch (error) {
    console.error("Error creating users:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getUserGroupsByType = async (req, res) => {
  console.log("Fetching user groups for type:", req.params.groupType);
  try {
    const { groupType } = req.params;
    const userGroups = await UserGroup.find({ groupType });
    res.status(200).json(userGroups);
  } catch (error) {
    console.error("Error fetching user groups:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const createNewUserGroup = async (req, res) => {
  try {
    const { name, groupType } = req.body;
    const newGroup = new UserGroup({ name, groupType, userCount: 0 });
    await newGroup.save();
    res
      .status(201)
      .json({ message: "User group created successfully", group: newGroup });
  } catch (error) {
    console.error("Error creating user group:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  initializeUserGroups,
  createNewUsers,
  getUserGroupsByType,
  createNewUserGroup,
};
