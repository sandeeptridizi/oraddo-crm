const PremiumPlan = require('../models/premiumPlans');
const depModule = require('../models/Modules');

exports.getAllPlans = async () => {
    try {
        const plans = await PremiumPlan.findAll({
            include:[{
                model: depModule,
                attributes:["id","name"]
            }],
            order: [['id', 'ASC']],
        });
        return (plans);
    } catch (error) {
        console.log({ message: error.message });
    }
};

exports.getPlanById = async (id) => {
    try {
        const plan = await PremiumPlan.findByPk(id,{
            include:[{
                model: depModule,
                attributes:["id","name"]
            }]
        });
        if (!plan) {
            return ({ message: 'Plan not found' });
        }
        return plan;
    } catch (error) {
      console.log({ message: error.message });
    }
};

exports.createPlan = async (data) => {
    try {
        const newPlan = await PremiumPlan.create(data);
       
        return newPlan;
    } catch (error) {
        console.log({ message: error.message });
    }
};

function getAllFuncs(toCheck) {
    const props = [];
    let obj = toCheck;
    try {
      do {
        props.push(...Object.getOwnPropertyNames(obj));
      } while ((obj = Object.getPrototypeOf(obj)));
      return props.sort().filter((e, i, arr) => {
        if (e != arr[i + 1] && typeof toCheck[e] == "function") return true;
      });
    } catch (error) {
      console.log("errorrrrr",error);
    }
    
  }


exports.updatePlanModule = async (data) => {
    try {
      console.log('daaataaaa',data);
      let plans = data;
      for(const key in plans){
        const premium = await PremiumPlan.findByPk(key);
        if (!premium) {
          console.log(`premium with id ${key} not found`);
          continue;
        }
        console.log("jsdidfjeif",premium);
        
        const functions = getAllFuncs(premium);
        console.log("All functions of department:", functions);
        console.log("depkeyyy",plans[key]);
        
        await premium.setModules(plans[key]);
      } 
      return {success:true, premiumModules : plans};
    } catch (error) {
      throw error;
    }
  };



exports.updatePlan = async (id, data) => {
    try {
        await PremiumPlan.update(data, {
            where: { id: id },
        });
        const updated = await PremiumPlan.findByPk(id, {
            include: [{
                model: depModule,
                attributes: ["id", "name"]
            }]
        });
        return updated;
    } catch (error) {
        console.log({ message: error.message });
    }
};


exports.deletePlan = async (id) => {
    try {
        const deletedPlan = await PremiumPlan.destroy(id);
        if (!deletedPlan) {
            return ({ message: 'Plan not found' });
        }
        return ({ message: 'Plan deleted successfully' });
    } catch (error) {
        console.log({ message: error.message });
    }
};
