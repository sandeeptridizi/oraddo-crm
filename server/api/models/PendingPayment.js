const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const PendingPayment = sequelize.define(
  "PendingPayment",
  {
    transactionId: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    signupToken: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    planId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    billingCycle: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "quarterly",
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("pending", "success", "failed"),
      allowNull: false,
      defaultValue: "pending",
    },
  },
  {
    tableName: "PendingPayments",
    timestamps: true,
  }
);

module.exports = PendingPayment;
