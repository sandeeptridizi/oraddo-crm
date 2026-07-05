// services/companyService.js
const Company = require('../models/OrganizationModule');
const uploadFile = require('../../fileUpload/fileupload');
const Allowed_type = require('../../fileUpload/alowedtypes');
const Employee_Onboarding = require('../models/Emp_onboarding');
const PremiumPlans = require('../models/premiumPlans');
const bcrypt = require('bcryptjs');
const cron = require('node-cron');
const { Op } = require('sequelize');
const OrganizationInvoices = require('../models/organizationInvoiceModule');
const OrgSignUp = require('../models/organizationSignUp');


const getNextInvoiceNumber = async () => {
  const lastInvoice = await OrganizationInvoices.findOne({
    order: [['createdAt', 'DESC']],
  });

  if (lastInvoice && lastInvoice.invoiceNumber) {
    const lastNumber = parseInt(lastInvoice.invoiceNumber.replace('ORDI', ''), 10);
    return `ORDI${String(lastNumber + 1).padStart(4, '0')}`;
  } else {
    return 'ORDI0001';
  }
};

const uploadFiles = async (files) => {
  console.log(files, 'ffffffffffff');

  const uploadPromises = files.map((file) => uploadFile(file, Allowed_type));
  try {
    const results = await Promise.all(uploadPromises);
    console.log(results, "results")
    const uploadedData = {
      image_URL: results[0].success ? results[0].url : null,
    };
    console.log(uploadedData, "datauploaded");
    return uploadedData;
  } catch (error) {
    console.log("errorrr", error);
    throw error;
  }
};

// const initializeCronJobs = () => {
//   cron.schedule('0 0 * * *', async () => {
//     console.log('Running daily plan expiry check...');

//     const today = new Date();

//     try {
//       const expiredOrganizations = await Company.findAll({
//         where: {
//           planExpiryDate: {
//             [Op.lt]: today, 
//           },
//         },
//       });

//       for (const org of expiredOrganizations) {
//         console.log(`Plan expired for organization: ${org.companyName}`);
//       }
//     } catch (error) {
//       console.error('Error during daily plan expiry check:', error);
//     }
//   });
// };




// const createCompany = async (data, files) => {
//   console.log(data, 'dddddddddddddd');

//     if (data.password) {
//     const saltRounds = 10; 
//     try {
//       data.password = await bcrypt.hash(data.password, saltRounds);
//       console.log('Password hashed successfully');
//     } catch (error) {
//       console.error('Error hashing password:', error);
//     }
//   }

//   if (files && Object.keys(files).length > 0) {
//     console.log('vishnu', files);

//     const fileKey = Object.keys(files)[0];
//     const fileArray = files[fileKey]; 
//     const file = fileArray[0];

//     if (!file) {
//       throw new Error('No file found in the provided files object');
//     }

//     const uploadData = await uploadFiles([file]);
//     console.log('uploadDataaaaa', uploadData);

//     data.companyLogo = uploadData.image_URL;
//   }

//   const organizationData = await Company.create(data);

//   const {id,password,userName}=organizationData;

//   if (organizationData) {
//     const data = {orgnaizationId:id,password:password,userName:userName,role:"Admin"}
//        console.log(data,'jhjhjhjjjh');
//     // await Employee_Onboarding.create(data);
//  await Employee_Onboarding.create(data, {
//     fields: ['orgnaizationId', 'password', 'userName'],
//      returning: false,
//   });

//   }

//   return organizationData
// };

// const createCompany = async (data, files) => {
//   console.log(data, 'Creating new company...');

//   if (data.password) {
//     const saltRounds = 10;
//     try {
//       data.password = await bcrypt.hash(data.password, saltRounds);
//       console.log('Password hashed successfully');
//     } catch (error) {
//       console.error('Error hashing password:', error);
//     }
//   }

//   if (files && Object.keys(files).length > 0) {
//     const fileKey = Object.keys(files)[0];
//     const fileArray = files[fileKey];
//     const file = fileArray[0];

//     if (!file) {
//       throw new Error('No file found in the provided files object');
//     }

//     const uploadData = await uploadFiles([file]);
//     data.companyLogo = uploadData.image_URL;
//   }

//   if (data.planId) {
//     const selectedPlan = await PremiumPlans.findByPk(data.planId);
//     if (selectedPlan) {
//       const duration = selectedPlan.duration; // e.g., "3 Months"
//       const durationParts = duration.split(' '); // ["3", "Months"]

//       if (durationParts.length === 2) {
//         const value = parseInt(durationParts[0], 10); // Extract the numeric value
//         const unit = durationParts[1].toLowerCase(); // Extract the time unit (e.g., "month", "year")

//         let expiryDate = new Date(); // Start from the current date
//         switch (unit) {
//           case 'month':
//           case 'months':
//             expiryDate.setMonth(expiryDate.getMonth() + value); // Add months
//             break;
//           case 'year':
//           case 'years':
//             expiryDate.setFullYear(expiryDate.getFullYear() + value); // Add years
//             break;
//           case 'day':
//           case 'days':
//             expiryDate.setDate(expiryDate.getDate() + value); // Add days
//             break;
//           default:
//             throw new Error('Invalid plan duration unit');
//         }

//         // Set plan start and expiry dates
//         data.planStartDate = new Date(); // Start date is the current date
//         data.planExpiryDate = expiryDate;
//       }
//     }
//   }

//   // Create the organization
//   const organizationData = await Company.create(data);
//   const { id, password, userName } = organizationData;

//   // Create the admin for the organization
//   if (organizationData) {
//     const adminData = {orgnaizationId:id,password:password,userName:userName,role:"Management"};
//     await Employee_Onboarding.create(adminData, {
//       fields: ['orgnaizationId', 'password', 'userName', 'role'],
//       returning: false,
//     });
//   }

//   // Return the created organization data
//   return organizationData;
// };


const createCompany = async (data, files) => {
  console.log(data, 'Creating new company...');

  if (data.password) {
    const saltRounds = 10;
    try {
      data.password = await bcrypt.hash(data.password, saltRounds);
      console.log('Password hashed successfully');
    } catch (error) {
      console.error('Error hashing password:', error);
    }
  }

  if (files && Object.keys(files).length > 0) {
    const fileKey = Object.keys(files)[0];
    const fileArray = files[fileKey];
    const file = fileArray[0];

    if (!file) {
      throw new Error('No file found in the provided files object');
    }

    const uploadData = await uploadFiles([file]);
    data.companyLogo = uploadData.image_URL;
  }

  if (data.planId) {
    const selectedPlan = await PremiumPlans.findByPk(data.planId);
    if (selectedPlan) {
      const duration = selectedPlan.duration; // e.g., "3 Months"
      const durationParts = duration.split(' '); // ["3", "Months"]

      if (durationParts.length === 2) {
        const value = parseInt(durationParts[0], 10); // Extract the numeric value
        const unit = durationParts[1].toLowerCase(); // Extract the time unit (e.g., "month", "year")

        let expiryDate = new Date(); // Start from the current date
        switch (unit) {
          case 'month':
          case 'months':
            expiryDate.setMonth(expiryDate.getMonth() + value); // Add months
            break;
          case 'year':
          case 'years':
            expiryDate.setFullYear(expiryDate.getFullYear() + value); // Add years
            break;
          case 'day':
          case 'days':
            expiryDate.setDate(expiryDate.getDate() + value); // Add days
            break;
          default:
            throw new Error('Invalid plan duration unit');
        }

        // Add 7 days to the expiry date to allow the plan to run for one extra week
        const extraWeek = new Date(expiryDate);
        extraWeek.setDate(extraWeek.getDate() + 7);

        // Set the plan start date and expiry date
        // if (data.isRenewal && data.previousExpiryDate) {
        // If it's a renewal, start date takes the previous expiry date
        // data.planStartDate = new Date(data.previousExpiryDate);
        // } else {
        data.planStartDate = new Date(); // Start date is the current date
        // }

        data.planExpiryDate = expiryDate; // Plan expiry date
        if (data.planId == 10) {
          data.planGracePeriodEnd = expiryDate;
          console.log(data.planGracePeriodEnd,"form planId free")
        }
        else {
          data.planGracePeriodEnd = extraWeek; // Plan end after an extra week
        }
      }
    }
  }

  // Create the organization
  const organizationData = await Company.create(data);
  console.log(organizationData, "organizationDattaaa")
  const { id, password, userName, email, adminName, phoneNumber, city } = organizationData;

  // Create the admin for the organization
  if (organizationData) {
    const adminData = {
      orgnaizationId: id,
      password: password,
      userName: userName,
      role: 'Management',
      emp_name: adminName,
      bussiness_email: email,
      contact_number: phoneNumber,
      isFinance: true,
      isBusiness: true,
      teamLeadId: null,
      isDelete: false,
      city: city,
      employee_type: "Permanent"
    };
    await Employee_Onboarding.create(adminData, {
      fields: ['orgnaizationId', 'password', 'userName', 'role', 'emp_name', 'bussiness_email', 'contact_number', 'isFinance', 'isBusiness', 'teamLeadId', 'isDelete', 'city', 'employee_type'],
      returning: false,
    });

    const inoviceData = {
      organizationId: id,
      planId: data.planId,
      startDate: data.planStartDate,
      endDate: data.planExpiryDate,
      graceDate: data.planGracePeriodEnd,
      invoiceNumber: await getNextInvoiceNumber(),
      invoiceDate: new Date(),
      amount: data.amount || null,
    };
    await OrganizationInvoices.create(inoviceData);
  }

  // Return the created organization data
  return organizationData;
};



const getAllCompanies = async () => {
  try {
    const data = await Company.findAll({
      include: [
        {
          model: Employee_Onboarding,
          as: 'Employees_data', // Correct alias
          attributes: ['id', 'emp_name', 'bussiness_email', 'role'], // Ensure only required fields are returned
        },
        {
          model: PremiumPlans, // Correct model reference
          as: 'organization_plan', // Ensure alias matches the association
        },
        {
          model: OrganizationInvoices,
          as: 'CompanyInvoices',
          include: [
            {
              model: PremiumPlans,
              as: 'organizationInvoice_plan',
            }
          ]
        }
      ]
    });

    return data;
  }
  catch (err) {
    console.log(err)
  }

};

// Get a company by ID
const getCompanyById = async (id) => {
  return await Company.findByPk(id, {
    include: [
      {
        model: Employee_Onboarding,
        as: 'Employees_data', // Correct alias
        where: { isDelete: false }, // Ensure only active employees are returned
        required: false, // LEFT JOIN: still return the org when it has no active employees
        attributes: ['id', 'emp_name', 'bussiness_email', 'role'], // Ensure only required fields are returned
      },
      {
        model: PremiumPlans, // Correct model reference
        as: 'organization_plan', // Ensure alias matches the association
      },
      {
        model: OrganizationInvoices,
        as: 'CompanyInvoices',
        include: [
          {
            model: PremiumPlans,
            as: 'organizationInvoice_plan',
          }
        ]
      }
    ]
  });
};

// Update a company
// const updateCompany = async (id, data) => {
//   console.log(id,'idididid',data,'dtdtdtdtdt');

//   const company = await Company.update(data,{
//     where:{id}
//   });
//   if (!company) throw new Error('Company not found');
//   return await company.update(data);
// };


const updateCompany = async (id, files, data) => {
  console.log(id, 'idididid', data, 'dtdtdtdtdt');

  const company = await Company.findOne({
    where: { id }
  });
  console.log(company,"companyyyyyyyyyyyyyy")

  if (!company) throw new Error('Company not found');
  if (files && Object.keys(files).length > 0) {
    const fileKey = Object.keys(files)[0];
    const fileArray = files[fileKey];
    console.log(fileArray,"fileArrayyy")
    const file = fileArray[0];
    console.log(file, "fileee")

    if (!file) {
      throw new Error('No file found in the provided files object');
    }

    const uploadData = await uploadFiles([file]);
    console.log(uploadData,"uploadDataaaa")
    // Guard against a failed upload (bad creds, network, or rejected mimetype):
    // uploadFiles resolves with image_URL=null instead of throwing, and writing
    // that null would silently wipe the org's existing logo. Fail loudly instead.
    if (!uploadData || !uploadData.image_URL) {
      throw new Error('Logo upload failed. Please check the file type and try again.');
    }
    data.companyLogo = uploadData.image_URL;

  }
  try{
    await company.update(data);

    return company;
  }catch(error){
    console.log(error,"error")
  }

};


// const updateCompany = async (id, files, data) => {
//   console.log(id, 'idididid', data, 'dtdtdtdtdt');

//   const company = await Company.findOne({
//     where: { id },
//   });

//   if (!company) throw new Error('Company not found');

//   // If files are provided, process and update the file-related fields
//   if (files && Object.keys(files).length > 0) {
//     const fileKey = Object.keys(files)[0];
//     const fileArray = files[fileKey];
//     const file = fileArray[0];

//     if (!file) {
//       throw new Error('No file found in the provided files object');
//     }

//     const uploadData = await uploadFiles([file]);
//     data.companyLogo = uploadData.image_URL; 
//      await company.update(data);
//   }else if(!files){
//      await company.update(data);
//   }

//   // Update company with the provided data


//   return company;
// };



// Delete a company
const deleteCompany = async (id) => {
  const company = await Company.findByPk(id);
  if (!company) throw new Error('Company not found');
  return await company.destroy();
};

// Create a trial organization from a public signup. Mirrors createCompany but
// skips file uploads and forces a 7-day plan window regardless of the chosen
// tier's stored duration. Returns the new Organization row.
const createTrialOrganization = async (data) => {
  const {
    fullName,
    email,
    password,
    phoneNumber,
    companyName,
    city,
    planId,
    billingCycle,
    amount,
    signupId,
  } = data;

  // Skip re-hashing if the password is already a bcrypt hash (prevents double-hash
  // when called from the payment callback which passes the stored hashed password).
  const alreadyHashed = password && (password.startsWith("$2a$") || password.startsWith("$2b$") || password.startsWith("$2y$"));
  const hashedPassword = password ? (alreadyHashed ? password : await bcrypt.hash(password, 10)) : null;

  const now = new Date();
  let expiry = new Date(now);
  let gracePeriodEnd = new Date(now);

  // For paid plans, derive expiry from the plan's actual duration (same logic as createCompany).
  // Only fall back to 7-day trial when no plan exists or it's the free plan (planId 10).
  if (billingCycle) {
    // Paid signup: use the billing cycle the user actually paid for
    switch (billingCycle) {
      case 'quarterly':
        expiry.setMonth(expiry.getMonth() + 3);
        break;
      case 'halfYearly':
        expiry.setMonth(expiry.getMonth() + 6);
        break;
      case 'annually':
        expiry.setFullYear(expiry.getFullYear() + 1);
        break;
      default:
        expiry.setMonth(expiry.getMonth() + 1); // fallback: monthly
    }
    gracePeriodEnd = new Date(expiry);
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 7);
  } else {
    // Free trial: 7 days, no extra grace week
    expiry.setDate(expiry.getDate() + 7);
    gracePeriodEnd = new Date(expiry);
  }

  const organizationData = await Company.create({
    organizationID: `TRIAL-${Date.now()}`,
    companyName: companyName || `${fullName || "Trial"}'s Workspace`,
    companyType: "Trial",
    industryType: "Trial",
    companyAddress: "TBD",
    founderYear: now.getFullYear(),
    companyLogo: null,
    companyWebsite: null,
    GSTIN: null,
    No_ofEmployees: 0,
    planId: planId || null,
    country: null,
    state: null,
    phoneNumber: phoneNumber || null,
    userName: email,
    password: hashedPassword,
    city: city || null,
    planStartDate: now,
    planExpiryDate: expiry,
    planGracePeriodEnd: gracePeriodEnd,
    adminName: fullName || null,
    email: email,
  });

  const { id: orgId, password: orgPassword, userName: orgUserName } = organizationData;

  // create the Management admin in Emp_onboarding (same shape as createCompany)
  const adminData = {
    orgnaizationId: orgId,
    password: orgPassword,
    userName: orgUserName,
    role: "Management",
    emp_name: fullName,
    bussiness_email: email,
    contact_number: phoneNumber,
    isFinance: true,
    isBusiness: true,
    teamLeadId: null,
    isDelete: false,
    city: city || null,
    employee_type: "Permanent",
  };
  await Employee_Onboarding.create(adminData, {
    fields: [
      "orgnaizationId",
      "password",
      "userName",
      "role",
      "emp_name",
      "bussiness_email",
      "contact_number",
      "isFinance",
      "isBusiness",
      "teamLeadId",
      "isDelete",
      "city",
      "employee_type",
    ],
    returning: false,
  });

  // create the trial invoice so the org appears on the invoices listing
  await OrganizationInvoices.create({
    organizationId: orgId,
    planId: planId || null,
    startDate: now,
    endDate: expiry,
    graceDate: gracePeriodEnd,
    invoiceNumber: await getNextInvoiceNumber(),
    invoiceDate: now,
    amount: amount || null,
  });

  // flip OrgSignUp.status to Converted once the operational org row exists
  if (signupId) {
    try {
      await OrgSignUp.update({ status: "Converted" }, { where: { id: signupId } });
    } catch (e) {
      console.log("failed to flip OrgSignUp.status to Converted", e.message);
    }
  }

  return organizationData;
};

module.exports = {
  createCompany,
  createTrialOrganization,
  getAllCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany
};
