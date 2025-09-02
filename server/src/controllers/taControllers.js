const ModuleDetails = require('../models/ModuleDetails');
const TaApplication = require('../models/TaApplication');
const User = require('../models/User');


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
    console.log(coordinatorMap);
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
    console.error('Error fetching modules:', error);
  }
};

const applyForTA = async (req, res) => {

  const taApplication= new TaApplication({
    userId :req.body.userId,
    moduleId : req.body.moduleId
  });

  try {
    await taApplication.save();
    res.status(201).json({ message: 'Application submitted successfully', application: taApplication });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting application', error });
  }
};



module.exports = {
  getAllRequests,
  applyForTA
};