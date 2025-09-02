const ModuleDetails = require('../models/ModuleDetails');
const User = require('../models/User');
// import User from '../models/User';


const getAllRequests = async (req, res) => {
  try {
    const modules = await ModuleDetails.find();
    const allCoordinators = modules.flatMap(module => module.coordinators);
    const uniqueCoordinators = [...new Set(allCoordinators)];
    const coordinatorDetails = await User.find({ googleId: { $in: uniqueCoordinators } });
    const coordinatorMap = coordinatorDetails.reduce((map, user) => {
      map[user.googleId] = user.name;
      return map;
    }, {}); 
    // console.log(coordinatorMap);
    const updatedModules = modules.map(module => {
      const obj = module.toObject();
      return {
        ...obj,
        coordinators: obj.coordinators.map(id => coordinatorMap[id] || "-")
      };
    });

    res.status(200).json(updatedModules);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching modules', error });
  }
};
module.exports = {
  getAllRequests
};