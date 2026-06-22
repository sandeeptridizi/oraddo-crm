require('dotenv').config();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const User = require('../models/Emp_onboarding');
const OrgSignUp = require('../models/organizationSignUp');
const SuperAdmin = require('../models/SuperAdmin');
const Department = require('../models/Department')
const blacklist = new Set(); // Example of an in-memory blacklist
const Organization = require('../models/OrganizationModule')

// const signUp = async (data) => {
//   try {
//     const { email, password } = data;
//     const existingUser = await db.query('SELECT * FROM users WHERE email = $1', [email]);

//     if (existingUser.rows.length > 0) {
//       throw new Error('User with this email already exists');
//     }

//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);

//     const newUser = await db.query(
//       'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email',
//       [email, hashedPassword]
//     );

//     return newUser.rows[0];
//   } catch (error) {
//     console.log('errrrrr', error);
//     throw error;
//   }
// };



// const signIn = async (userName, password, organizationId) => {
//   try {
//     // console.log('nameeeandpassword', emp_id,password);
//     console.log(userName, password, "from frntend")

//     const OrganizationEmployee = await Organization.findOne({ where: { organizationID: organizationId } })


//     if (!OrganizationEmployee) {
//       throw new Error('Invalid Organization ID');
//     }

    

//     console.log(OrganizationEmployee, "orggggEmppp")
//     const userdata = await User.findOne({ where: { userName: userName } })

//     if (!userdata) {
//       throw new Error('Invalid UserID');
//     }

//     if(userdata.isDelete){
//       throw new Error("Your account is inactive.")
//     }

//     // console.log('userrrr detailssss', user.id);
//     if (userdata?.orgnaizationId === OrganizationEmployee?.id) {
//       const userDetails = await User.findByPk(userdata.id, {
//         include: [
//           //   //   {
//           //   //   model: Department,
//           //   //   as:'departentsOfEmp'
//           //   // },
//           {
//             model: Organization,
//             as: 'organization_Employees', // Matches the alias in `belongsTo`
//           }
//         ]
//       })

//       // console.log('userrrr DDDDetailssss', userDetails.dataValues);
//       let user = userDetails.dataValues;
//       console.log("departmentssss", user);

//       // user.empDepartment = userDepartment.departentsOfEmp.name
//       // console.log("employeeedepartment", user.empDepartment, userDepartment.departentsOfEmp.name);
//       console.log("passwordddd", user.password);

//       const hashpass = await bcrypt.compare(password, user.password);
//       console.log("hasssss", hashpass);

//       if (user && hashpass) {
//         console.log("servvvvvvvvv");

//         try {
//           const token = jwt.sign({ user }, "eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWV9");
//           console.log(token, "vhjjwgdasxziuadsc")
//           return token;
//         } catch (error) {
//           console.log("jjjjj", error);

//         }
//         // { expiresIn: '1h' }
//       } else {
//         throw new Error('Invalid password');
//       }
//     }
//     else {
//       throw new Error('Invalid Organization ID');
//     }

//   } catch (error) {
//     console.log('errrrrr', error);
//     throw error;
//   }
// };


const unifiedSignIn = async (identifier, password) => {
  const JWT_SECRET = process.env.JWT_SECRET;

  try {
    if (!identifier || !password) {
      throw new Error("Email/Username and password are required");
    }

    // 1. Try Super Admin Login first (New Table)
    const superAdmin = await SuperAdmin.findOne({ where: { email: identifier } });
    if (superAdmin) {
      const isSuperAdminPassValid = await bcrypt.compare(password, superAdmin.password);
      if (isSuperAdminPassValid) {
        const token = jwt.sign(
          { adminId: superAdmin.id, email: superAdmin.email, role: "admin" },
          JWT_SECRET,
          { expiresIn: "1d" }
        );
        return {
          token,
          role: "admin",
          user: { id: superAdmin.id, fullName: superAdmin.fullName, email: superAdmin.email, type: "superadmin", organizationId: 0 }
        };
      }
    }

    // 2. Try Organization Signup Login (Client Admins)
    const admin = await OrgSignUp.findOne({ where: { email: identifier } });
    if (admin) {
      const savedAdminPassword = admin.password || "";
      const isAdminPassValid = (savedAdminPassword.startsWith("$2a$") || savedAdminPassword.startsWith("$2b$") || savedAdminPassword.startsWith("$2y$"))
        ? await bcrypt.compare(password, savedAdminPassword)
        : password === savedAdminPassword;

      if (isAdminPassValid) {
        // The signup record (OrgSignUp) and the operational Organizations record
        // are separate tables with different ids. All org-scoped data (employees,
        // expenses, leads, projects…) is keyed by Organizations.id — which is NOT
        // the same as OrgSignUp.id — so resolve the real organization (matched by
        // email/userName/companyName) and scope the session to it. Without this,
        // the admin's session points at the wrong org id and every list comes back
        // empty. Fall back to admin.id if no Organizations record is found.
        const organization = await Organization.findOne({
          where: {
            [Op.or]: [
              { email: admin.email },
              { userName: admin.email },
              { companyName: admin.companyName },
            ],
          },
          order: [["id", "ASC"]],
        });

        // If no Organization row exists yet, the user registered but never
        // selected a plan. Issue a fresh signup-pending token so the frontend
        // can drop them back onto the pricing page to complete the flow.
        if (!organization) {
          const signupToken = jwt.sign(
            { signupId: admin.id, email: admin.email, purpose: "signup-pending" },
            JWT_SECRET,
            { expiresIn: "30m" }
          );
          return {
            needsPlan: true,
            signupToken,
            signupId: admin.id,
            email: admin.email,
          };
        }

        const organizationId = organization.id;

        const token = jwt.sign(
          { userId: admin.id, organizationId, email: admin.email, role: "organization" },
          JWT_SECRET,
          { expiresIn: "1d" }
        );
        return {
          token,
          role: "organization",
          user: {
            id: admin.id,
            fullName: admin.fullName,
            email: admin.email,
            role: "organization",
            organizationId,
          },
        };
      }
    }

    // 2. Try Employee/User Login
    const emp = await User.findOne({
      where: {
        [Op.or]: [
          { userName: identifier },
          { personal_email: identifier },
          { bussiness_email: identifier },
        ],
      },
    });

    if (emp) {
      if (emp.isDelete) {
        throw new Error("Your account is inactive.");
      }

      const savedEmpPassword = emp.password || "";
      const isEmpPassValid = (savedEmpPassword.startsWith("$2a$") || savedEmpPassword.startsWith("$2b$") || savedEmpPassword.startsWith("$2y$"))
        ? await bcrypt.compare(password, savedEmpPassword)
        : password === savedEmpPassword;

      if (isEmpPassValid) {
        const token = jwt.sign(
          { userId: emp.id, role: emp.role || "employee" },
          JWT_SECRET,
          { expiresIn: "1d" }
        );
        return {
          token,
          role: emp.role || "employee",
          user: { 
            id: emp.id, 
            fullName: emp.emp_name, 
            email: emp.personal_email, 
            organizationId: emp.orgnaizationId,
            department: emp.department 
          }
        };
      }
    }

    throw new Error("Invalid email/username or password");
  } catch (error) {
    throw error;
  }
};

// Mint an organization session WITHOUT a password check. Used after an
// already-verified action (e.g. a confirmed PhonePe payment) where the caller
// holds only the bcrypt hash, not the plaintext, so unifiedSignIn's
// bcrypt.compare would always fail. Resolves OrgSignUp -> Organization by email
// and returns the same { token, role, user } shape as unifiedSignIn's org branch.
const createSessionForOrg = async (email) => {
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!email) {
    throw new Error("email is required to create an org session");
  }

  const admin = await OrgSignUp.findOne({ where: { email } });
  if (!admin) {
    throw new Error("Signup record not found for session");
  }

  const organization = await Organization.findOne({
    where: {
      [Op.or]: [
        { email: admin.email },
        { userName: admin.email },
        { companyName: admin.companyName },
      ],
    },
    order: [["id", "ASC"]],
  });

  if (!organization) {
    throw new Error("Organization not found for session");
  }

  const organizationId = organization.id;
  const token = jwt.sign(
    { userId: admin.id, organizationId, email: admin.email, role: "organization" },
    JWT_SECRET,
    { expiresIn: "1d" }
  );
  return {
    token,
    role: "organization",
    user: {
      id: admin.id,
      fullName: admin.fullName,
      email: admin.email,
      role: "organization",
      organizationId,
    },
  };
};

const signIn = async (userName, password, organizationId) => {
  const JWT_SECRET = process.env.JWT_SECRET;

  try {
    if (!userName || !password) {
      throw new Error("Username/email and password are required");
    }

    const resolvedOrganizationId =
      organizationId || process.env.DEFAULT_ORGANIZATION_ID || "SEED_ORG_001";

    let OrganizationEmployee = null;
    if (resolvedOrganizationId) {
      OrganizationEmployee = await Organization.findOne({
        where: { organizationID: resolvedOrganizationId },
      });
    }

    if (!OrganizationEmployee) {
      OrganizationEmployee = await Organization.findOne({ order: [["id", "ASC"]] });
    }

    if (!OrganizationEmployee) {
      throw new Error("Invalid Organization ID");
    }

    // Check if the plan is expired
    const currentDate = new Date();
    const planGracePeriodEnd = OrganizationEmployee.planGracePeriodEnd
      ? new Date(OrganizationEmployee.planGracePeriodEnd)
      : null;

    if (planGracePeriodEnd && currentDate > planGracePeriodEnd) {
      throw new Error("Your plan is not active. Please activate your plan.");
    }

    const userdata = await User.findOne({
      where: {
        [Op.or]: [
          { userName: userName },
          { personal_email: userName },
          { bussiness_email: userName },
        ],
      },
    });

    if (!userdata) {
      throw new Error("Invalid UserID");
    }

    if (userdata.isDelete) {
      throw new Error("Your account is inactive.");
    }

    if (userdata?.orgnaizationId === OrganizationEmployee?.id) {
      const userDetails = await User.findByPk(userdata.id, {
        include: [
          {
            model: Organization,
            as: "organization_Employees",
          },
        ],
      });

      let user = userDetails.dataValues;
      const savedPassword = user.password || "";
      const isHashedPassword =
        savedPassword.startsWith("$2a$") ||
        savedPassword.startsWith("$2b$") ||
        savedPassword.startsWith("$2y$");
      const hashpass = isHashedPassword
        ? await bcrypt.compare(password, savedPassword)
        : password === savedPassword;

      if (user && hashpass) {
        try {
          const token = jwt.sign(
            { userId: user.id, role: user.role || "employee" },
            JWT_SECRET,
            { expiresIn: "1d" }
          );
          return token;
        } catch (error) {
          throw new Error("Token generation failed.");
        }
      } else {
        throw new Error("Invalid password");
      }
    } else {
      throw new Error("Invalid Organization ID");
    }
  } catch (error) {
    throw error;
  }
};



const signOut = (token) => {
  blacklist.add(token);
};

const isTokenBlacklisted = (token) => {
  return blacklist.has(token);
};




module.exports = {
  //   signUp,
  signIn,
  unifiedSignIn,
  createSessionForOrg, // Mint org session post-payment (no password check)
  signOut, // Export the signOut function
  isTokenBlacklisted, // Export function to check token blacklisting
};
