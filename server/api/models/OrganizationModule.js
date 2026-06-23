const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Organization = sequelize.define('Organization', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  organizationID: {
    type: DataTypes.STRING, 
    unique: true,
    allowNull: false,
  },
  companyName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  companyType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  industryType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  companyAddress: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  companyRegistrationNumber: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
  founderYear: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  companySize: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  companyLogo: {
    type: DataTypes.STRING, // URL for the logo
    allowNull: true,
  },
  companyWebsite: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  GSTIN:{
    type:DataTypes.STRING,
    allowNull:true
  },
  No_ofEmployees:{
    type:DataTypes.INTEGER,
    allowNull:true
  },
  // organizationID:{
  //   type:DataTypes.STRING,
  //   allowNull:true
  // },
  planId:{
    type:DataTypes.INTEGER,
    allowNull:true
  },
  country:{
    type:DataTypes.STRING,
    allowNull:true
  },
  state:{
    type:DataTypes.STRING,
    allowNull:true
  },
  phoneNumber:{
    type:DataTypes.STRING,
    allowNull:true
  },
  userName:{
    type:DataTypes.STRING,
    allowNull:true
  },
  password:{
    type:DataTypes.STRING,
    allowNull:true
  },
  city:{
    type:DataTypes.STRING,
    allowNull:true
  },
  planStartDate:{
    type:DataTypes.DATE,
    allowNull:true
  },
  planExpiryDate:{
    type:DataTypes.DATE,
    allowNull:true
  },
  planGracePeriodEnd: { 
    type: DataTypes.DATE,
    allowNull: true,
  },
  adminName:{
    type:DataTypes.STRING,
    allowNull:true
  },
  email:{
    type:DataTypes.STRING,
    allowNull:true
  },
  accountNumber:{
    type:DataTypes.STRING,
    allowNull:true
  },
  bankName:{
    type:DataTypes.STRING,
    allowNull:true
  },
  IFSC_Code:{
    type:DataTypes.STRING,
    allowNull:true
  },
  isLocked: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
});

module.exports = Organization;