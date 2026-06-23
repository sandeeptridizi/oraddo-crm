const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const OrganizationInvoices = sequelize.define('OrganizationInvoices', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    organizationId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    planId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    invoiceNumber: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    invoiceDate: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    startDate: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    endDate: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    graceDate: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    amount: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
});

module.exports = OrganizationInvoices;