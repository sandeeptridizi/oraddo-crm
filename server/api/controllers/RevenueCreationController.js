const revenueService = require("../services/RevenueCreationServices");

const createRevenue = async (req, res) => {
  try {
    const revenue = await revenueService.createRevenue(req.body);
    res.status(201).json(revenue);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllRevenues = async (req, res) => {
  try {
    const revenues = await revenueService.getAllRevenues();
    res.status(200).json(revenues);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllRevenuesbyOrganizationId = async (req, res) => {
  try {
    const { year } = req.query;
    const yearInt = parseInt(year) || new Date().getFullYear();
    const revenues = await revenueService.getAllRevenuesbyOrganizationId(req.params.id,yearInt);
    res.status(200).json(revenues);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

const getRevenueById = async (req, res) => {
  try {
    const revenue = await revenueService.getRevenueById(req.params.id);
    if (revenue) {
      res.status(200).json(revenue);
    } else {
      res.status(404).json({ message: "Revenue not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateRevenue = async (req, res) => {
  try {
    const revenue = await revenueService.updateRevenue(req.params.id, req.body);
    res.status(200).json(revenue);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteRevenue = async (req, res) => {
  try {
    await revenueService.deleteRevenue(req.params.id);
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createRevenue,
  getAllRevenues,
  getRevenueById,
  updateRevenue,
  deleteRevenue,
  getAllRevenuesbyOrganizationId
};
