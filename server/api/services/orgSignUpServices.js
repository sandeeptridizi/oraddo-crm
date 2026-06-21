const OrgSignUp = require("../models/organizationSignUp");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

const creatieSignUp = async (data) => {
  const { email, password } = data;
  try {
    const existingAdmin = await OrgSignUp.findOne({ where: { email } });
    if (existingAdmin) {
      return existingAdmin;
    }

    const payload = { ...data };
    if (password) {
      payload.password = await bcrypt.hash(password, 10);
    }
    // New public signups start as "Processing" — flipped to "Converted" by
    // /api/signup/start-trial once the operational Organization is built.
    if (!payload.status) {
      payload.status = "Processing";
    }

    const admin = await OrgSignUp.create(payload);
    return admin;

  }
  catch (error) {
    throw new Error('Error in creating user');
  }
};


const orgSignIn = async (data) => {
  const { email, password } = data;

  try {
    const admin = await OrgSignUp.findOne({ where: { email } });
    if (!admin) {
      throw new Error("Invalid credentials");
    }

    const savedPassword = admin.password || "";
    const isHashedPassword = savedPassword.startsWith("$2a$") || savedPassword.startsWith("$2b$") || savedPassword.startsWith("$2y$");
    const isPasswordValid = isHashedPassword
      ? await bcrypt.compare(password, savedPassword)
      : password === savedPassword;

    if (!isPasswordValid) {
      throw new Error("Invalid credentials");
    }

    const token = jwt.sign(
      { adminId: admin.id, email: admin.email, role: "admin" },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    return {
      token,
      admin: {
        id: admin.id,
        fullName: admin.fullName,
        email: admin.email,
        role: "admin"
      }
    };
  } catch (error) {
    throw error;
  }
};

const getSignUpData = async () => {
  try {
    const getResponse = await OrgSignUp.findAll();
    const data = getResponse.map((record) => record?.dataValues);
    return data;
  } catch (error) {
    console.log(error, "data not getting in services");
  }
};

const getSignUpDataById = async (id) => {
  try {
    const getIdResponse = await OrgSignUp.findByPk(id);
    return getIdResponse;
  } catch (error) {
    console.log(error, "error in Services");
  }
};

const updateOrgData = async (id, data) => {
  try {
    await OrgSignUp.update(data, { where: { id } });
    const updated = await OrgSignUp.findByPk(id);
    return updated;
  }
  catch (error) { throw error; }
}



module.exports = {
  creatieSignUp,
  getSignUpData,
  getSignUpDataById,
  orgSignIn,
  updateOrgData
};
