const { get } = require("mongoose");
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
    }else if(userRole === "lecturer"|| userRole==="hod"){
      for (const user of users) {
        if (!user.displayName) {
          return res
            .status(400)
            .json({ message: "Display Name is required for this user type." });
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

const getUsersFromGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const users = await User.find({ userGroup: groupId });
    const payload = users.map(user => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      profilePicUrl: user.profilePicture,
      dateAdded: user.createdAt,
      indexNumber: user.indexNumber,
    }));
    res.status(200).json(payload);
  } catch (error) {
    console.error("Error fetching users from group:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const deleteUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const deleteUsers = async (req, res) => {
  try {
    const { userIds } = req.body;
    const deletedUsers = await User.deleteMany({ _id: { $in: userIds } });
    res.status(200).json({ message: "Users deleted successfully", deletedCount: deletedUsers.deletedCount });
  } catch (error) {
    console.error("Error deleting users:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const deleteWholeUserGroup = async (req, res) => {
  const session = await User.startSession();
  session.startTransaction();
  try {
    const { groupId } = req.params;
    // Delete all users with this groupId
    const deletedUsers = await User.deleteMany({ userGroup: groupId }).session(session);
    // Delete the group itself
    const deletedGroup = await UserGroup.findByIdAndDelete(groupId).session(session);
    if (!deletedGroup) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "User group not found" });
    }
    await session.commitTransaction();
    session.endSession();
    res.status(200).json({ message: "User group and all its users deleted successfully", deletedUsersCount: deletedUsers.deletedCount });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error deleting user group and its users:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const updateUserGroupName = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { newName } = req.body;
    const updatedGroup = await UserGroup.findByIdAndUpdate(
      groupId,
      { name: newName },
      { new: true }
    );
    if (!updatedGroup) {
      return res.status(404).json({ message: "User group not found" });
    }
    res.status(200).json({ message: "User group updated successfully", group: updatedGroup });
  } catch (error) {
    console.error("Error updating user group:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const updateUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, role, ...others } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, email, ...others },
      { new: true }
    );
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User details updated successfully", user: updatedUser });
  } catch (error) {
    console.error("Error updating user details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getAllLecturers = async (req, res) => {
  console.log("Fetching all lecturers...");
  try {
    const lecturers = await User.find({ role: { $in: ["lecturer"] } });
    res.status(200).json(lecturers);
  } catch (error) {
    console.error("Error fetching lecturers:", error);
    return res.status(500).json({ message: "Internal server error" });
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
  getUsersFromGroup,
  deleteWholeUserGroup,
  deleteUserById,
  deleteUsers,
  updateUserGroupName,
  updateUserDetails,
  getAllLecturers,
};
