const express = require("express");
const crypto = require("crypto");
const fs = require("fs");
const defineAssociations = require("./api/association/association");
const bodyParser = require("body-parser");
const sequelize = require("./config/database");
const cors = require("cors");
const cron = require("node-cron");
const userRoutes = require("./api/routes/employeeRoutes");
const reportSubmissionRoutes = require("./api/routes/reportSubmissionRoutes");
const salaryManagementRoutes = require("./api/routes/salaryManagementRoutes");
const salaryAdvanceRoutes = require("./api/routes/salary_advanceRoutes");
const { sendNotificationToTokens } = require("./api/utils/fcm");
const hiringActivitiesRoutes = require("./api/routes/hiring_activitiesRoutes");
const teamPerformanceRoutes = require("./api/routes/team_perfomanceRoutes");
const holidayCreationRoutes = require("./api/routes/holiday_crteationRoutes");
const praposalRoutes = require("./api/routes/praposalQuotationRoutes");
const managementCreationRoutes = require("./api/routes/leadManagementRoutes");
const invoiceManagementRoutes = require("./api/routes/InvoiceMangementRoutes");
const leavesCreationRoutes = require("./api/routes/leavesCreationRoutes");
const revenueRoutes = require("./api/routes/RevenuecreationRoutes");
const authRoutes = require("./api/routes/authRoute");
const departmentRoutes = require("./api/routes/departmentRoutes");
const ModulesRoutes = require("./api/routes/modulesRoutes");
const attendenceRoutes = require("./api/routes/attendenceRoute");
const praposalServiceRoutes = require("./api/routes/praposalServciesRoutes");
const empDocumentsRoutes = require("./api/routes/empDocumentsRoutes");
const employeeExpensesRoutes = require("./api/routes/employeeExpensesRoutes");
const taskRoutes = require("./api/routes/taskRoutes");
const employeeTask = require("./api/routes/employee_Task");
const empNotes = require("./api/routes/notesRoute");
const Meeting = require("./api/routes/attendenceMeetingRoute");
const empTasks = require("./api/routes/taskRoutes");
const projectRoutes = require("./api/routes/projectsRoutes");
const projectSprintsRoute = require("./api/routes/projectSprintRoutes");
const notification = require("./api/routes/notificationsRoute");
const EmpsatisfactionSurveyRoutes = require("./api/routes/employeeSatisfactionSurveyRoutes");
const empPollRoutes = require("./api/routes/employeePolleRoutes");
const empResignationRoutes = require("./api/routes/employeeResignationRoutes");
const gratuityRoutes = require("./api/routes/GratuityRoutes");
const JobManagementRoutes = require("./api/routes/JobManagementRoutes");
const shiftCreationRoutes = require("./api/routes/ShiftCreationRoutes");
const TrainingRoutes = require("./api/routes/TrainingManagementRoutes");
const Datapoints = require("./api/routes/datapointsRoutes");
const employeeFinalSettlement = require("./api/routes/employeeFinalSettlemetRoute");
const Survey = require("./api/routes/formSurveyRoutes");
const leadCreation = require("./api/routes/leadCreationRoutes");
const invoiceModuleRoutes = require("./api/routes/invoiceModuleRoute");
const expensesManagementCreationRoute = require("./api/routes/expensesCreationManagementRoute");
const projectBoard = require("./api/routes/projectBoardCreationRoutes");
const marketingStrategies = require("./api/routes/marketStrategiesRoutes");
const meeting_Mom = require("./api/routes/meetingMomRoute");
const FAQ = require("./api/routes/faqRoute");
const marketingMeetingEve = require("./api/routes/marketingEventsMeetingsRoute");
const newDataPoints = require("./api/routes/newDataPointRoute");
const {
  generateSalaryPayslip,
} = require("./api/controllers/attendenceController");
const Emp_onboarding = require("./api/models/Emp_onboarding");
const Attendance = require("./api/models/attendence");
const InboundLeads = require("./api/routes/InboundLeadRoute");
const Client = require("./api/routes/Clients");
const blogsRoutes = require("./api/routes/blogRoutes");
const triningModuleRoute = require("./api/routes/trainingModuleRoute");
const OrganizationRoute = require("./api/routes/OrganizationRoute");
const organizationSignUp = require("./api/routes/orgRegisterRoute");
const premiumPlans = require("./api/routes/premiumPlansRoute");
const renewelPlans = require("./api/routes/planRenewelRoute");
const phonepeRoute = require("./api/routes/phonepayRoute");
require("./api/models/PendingPayment"); // ensure PendingPayments table is created on sync
const contactForm = require("./api/routes/contactForm");
const organizationInvoice = require("./api/routes/organizationInvoiceRoute");
const serviceRouter = require("./api/routes/invoiceModuleServicesRoute");
const SaapRoutes = require("./api/routes/sapRoutes");
const testFormRoute = require("./api/routes/testFormRoute");
const questionRoute = require("./api/routes/questionRoutes");
const imageFigmaRoute = require("./api/routes/imageRoute");
const MainImageRoute = require("./api/routes/assetsImagesRoute");
const HrPanelRoute = require("./api/routes/HrPanelRoute");
const EmployeeDocumentation = require("./api/routes/EmployeeDocumentation");
const fcmTokenRoute = require("./fcmTokenRoute");
const { Op, where } = require("sequelize");
const Organization = require("./api/models/OrganizationModule");
const Employee = require("./api/models/Emp_onboarding");
const Notifications = require("./api/models/Notifications");
const sharedNotes = require("./api/routes/shareNoteRoute");
const announcementRoute = require("./api/routes/announcementsRoute")
const couponsRoutes = require("./api/routes/couponsRoutes");
// const kanbanAuto =require("./api/routes/kanbanAutoRoute")
const projectDetailedRoutes = require("./api/routes/projectDetailedRoutes");
const groupChatRoutes = require("./api/routes/groupChatRoute");
const chatRoutes = require("./api/routes/chatRoute");
const supportRoutes = require("./api/routes/supportRoute");
const adminSettingsRoute = require("./api/routes/adminSettingsRoute");


require("dotenv").config();
const { google } = require("googleapis");

const cookieParser = require("cookie-parser");
require("./api/cronJobs/cronJobs");
// Use cookie-parser middleware to handle cookies

const path = require("path");
const {
  calculateMonthlyLOP,
} = require("./api/controllers/attendenceController");
const HrPanel = require("./api/models/HrPanel");
const GroupChat = require("./api/models/GroupModel");
// const Company = require("./api/models/OrganizationModule");

const app = express();
const PORT = process.env.PORT || 11512;
app.use(cookieParser());

// Set up HTTP server and integrate with Socket.io
const server = require("http").createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  const { adminId } = socket.handshake.query;

  if (adminId) {
    socket.join(adminId); // Join a room named after the adminId
    console.log(`Admin ${adminId} connected: ${socket.id}`);

    // Find the employee's organization and join the organization room for announcements
    (async () => {
      try {
        const employee = await Employee.findByPk(adminId, { attributes: ['orgnaizationId'] });
        if (employee && employee.orgnaizationId) {
          const orgRoom = `org_${employee.orgnaizationId}`;
          socket.join(orgRoom);
          console.log(`User ${adminId} joined organization room: ${orgRoom}`);
        }
      } catch (error) {
        console.error(`Error joining organization room for user ${adminId}:`, error);
      }
    })();

  // Handle joining group rooms asynchronously
    socket.on("joinUserGroups", async () => {
      try {
        // Fetch groups where the user is a member or admin
        const groups = await GroupChat.findAll({
          include: [
            {
              model: Emp_onboarding,
              as: "members",
              where: { id: parseInt(adminId) },
              required: false, // Allow for admin even if not in members
            }
          ],
          where: {
            [Op.or]: [
              sequelize.where(sequelize.col("adminId"), "=", parseInt(adminId)),
              { id: { [Op.in]: sequelize.literal(`(SELECT "groupId" FROM "GroupMembers" WHERE "empId" = ${parseInt(adminId)} )`) } } // Assuming a junction table GroupMembers if exists; adjust based on actual association
            ]
          }
        });

        groups.forEach((group) => {
          socket.join(`group_${group.id}`);
          console.log(`User ${adminId} joined group room: group_${group.id}`);
        });
      } catch (error) {
        console.error("Error joining user to groups:", error);
      }
    });

    // Trigger join on connection (client should emit 'joinUserGroups' after auth)
    socket.emit("requestJoinGroups");
  } else {
    console.warn(`Socket connection without adminId: ${socket.id}`);
  }

  socket.on("disconnect", () => {
    console.log(`Admin disconnected: ${socket.id}`);
  });
});

// Middleware to attach io to the request object
app.use((req, res, next) => {
  req.io = io;
  next();
});

const corsOpts = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOpts));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

defineAssociations();

const MERCHANT_KEY = "mHEhxE";
const MERCHANT_SALT =
  "MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCp9r5f/GlA4ObuLptdetNA3/eb7vrV1yFius9PBm3S9oNAIVgnhb8OLKmSkZEs9XbBH927MH2/zQQdtKU7c1scuNP0JxwTe1Reh6GeKie6nKl/fKAxm2X5n8syQ9clkrxsHyvDWUHl2mjEkzwjh7qqg/WYt/fq+cOmgz0qDtzSjxdKo/z+w5RRryi5DJGS8njqbZeg0kwdX5PYtE/frHEKBrMZK/9Rus8Qoxv8yO8MPiXyJ1K5poxVbD6P1SAsbVI41eLc7N5d/UN0yOtKt16cJ984uZGD3FJrpxlLzG/OA7rCXgn1PHbOq3jPVOIW/FcxyOABqKi6+kr9TeOxIboXAgMBAAECggEAZMDyhfAZbO5ltxhF3ZpsFO8v125Jn+5Ryjc3oX8MJ50enSunGHa+lWaAd3R3fRFd/oonZUoPoV2lbP6jXKS7hEFE1F1C1YGsuATrF9mhh4xLJln4lK+sOdgyGnAA4DMmI2ovBTSqTdm1daJaai2RyHdFZezYuKCrDNCLt5zr5p0Y/51l8F75vwytZrk3UcBMseSe8/tgX+HYQZEl2x0xBMHyYS4+gHfmFwRUcK/PFiTOu3vPfha/qyYjGH2l0H6hvtk5AFtyd8u6ER2QwcrVgZM9498E5MOzapKXi0N5Hza+dblS4Cn3rQ96ICEOaPyETpLkudhzLmuYkwJpzSeB8QKBgQDaQb/NtAAjN9UUVVNzoyHkpDMnT0NJztzVLsp4SdJeSggeChccYsGfY878EJaHHkMgFDxrUHUo+0VUYBchsYMayH6vhu/5ynM6lTRnwqn6kSuMdZSZsr33WJolcxQylCxBGtIQ+OzcYVZ5vjZvYiDvzKV1xUekstp6+3MVFjhKvQKBgQDHWw8jP4CtP9FF7tXffSJxi/L6KnRmAohv6RjUJNlftw2FBqSauL1WUqEm/jX3PLmi+9SBrwa6yBd0T3IYRTHeXbnENtfa0NU7/R3P9chPyMUbdND18meQNbzFeJKtQVQElVJge5muztyFMOltA04NPoeKJnfIOF34h0IVrobPYwKBgCK7Rcd5NnBkSR80ONR1CEa3LoC5505OgevWx1d+/+ALTeFh362ftYokuuJ3zUxxL2NidP7qzcoYuj6kD+pHskJH14kdIwEQC2guKCm+24fJJDH04BHZVMuQqO7+sh8eXzB5ESasRh0HzFgRQd5VskIWwdnM7Aq0f3oEm5qmb4zNAoGBAIZ3YD2JPtUdH55JG8+USyBFoo2lB0ArYzYBBzNI66pJAYCB25NVGrjYIUT44ROzzQ8nR851bVedUVytnarLOXjgxUWZLH22sK227F3yTburE3CSmcPbTomSBZM44c6lKvOweJEFrcKgW1QnirtyKDp8u9WuXssZYiEZsrSHNP07AoGATMPG9blwxCVNxXjWTp6kBXpK3qqRApi32L417cRAGwDChQrIUAr9hAoBk50afu7NBKKME+XwvdPtPLKM8Uiu2EiUVSUqDiAUHeZuTNa9hB8+4eAR75Dhpp0XYJ3UBA4D+PSPrCjgT12VxlZHBcJcHpjjqFrPshMfniG50op4duY=";
// const PAYU_URL = "https://secure.payu.in/_payment";

app.post("/generate-hash", (req, res) => {
  const { txnid, amount, productinfo, firstname, email } = req.body;

  const hashString = `${MERCHANT_KEY}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|||||||||||${MERCHANT_SALT}`;

  const hash = crypto.createHash("sha512").update(hashString).digest("hex");

  res.json({ hash });
});

// Handle Payment Response
app.post("/payment-response", (req, res) => {
  console.log(req, "hgfxzfghjk");

  const data = req.body;

  const hashString = `${MERCHANT_SALT}|${data.status}|||||||||||${data.email}|${data.firstname}|${data.productinfo}|${data.amount}|${data.txnid}|${MERCHANT_KEY}`;

  // const hash = crypto.createHash("sha512").update(hashString).digest("hex");

  if (data.status === "success") {
    return res.redirect(`https://tridizi.com/sucess?txnid=${data.txnid}`);
    // res.json({ success: true, message: "Payment Successful", data });
  } else {
    return res.redirect(`https://tridizi.com/failure`);
    // res.status(404).json({ success: false, message: "Payment Verification Failed" });
  }
});

// cron.schedule("59 23 28-31 * *", async () => {
//   // cron.schedule('* * * * *', async () => {
//   console.log("Running test LOP calculation...");
//   // const today = moment();
//   // const isMonthEnd = today.endOf('month').isSame(today, 'day');

//   // if (isMonthEnd) {
//   console.log("Running monthly LOP calculation...");
//   try {
//     await generateSalaryPayslip();
//     console.log("Monthly LOP calculation completed successfully.");
//   } catch (error) {
//     console.error("Error in monthly LOP calculation:", error);
//   }
//   // }
// });

// Define punch-in and punch-out times
// const PUNCH_IN_TIME = "10:00";
// const PUNCH_OUT_TIME = "19:00";
// const DURATION = "09:00";
// 9 hours (from 10 AM to 7 PM)
// Schedule cron job to run every Sunday at 8:00 AM
cron.schedule("0 8 * * 0", async () => {
  // cron.schedule('* * * * *', async () => {
  try {
    const today = new Date();
    const date = today.toISOString().split("T")[0]; // Format as YYYY-MM-DD

    // Fetch all organizations
    const organizations = await Organization.findAll();

    for (const organization of organizations) {
      const hrSettings = await HrPanel.findOne({
        where: { organizationID: organization?.id },
      });

      if (!hrSettings?.punchInTime || !hrSettings?.punchOutTime) {
        console.error("Punch in/out times are missing for organization:", organization.id);
        continue;
      }

      // Corrected duration calculation
      const punchIn = new Date(`1970-01-01T${hrSettings.punchInTime}`);
      const punchOut = new Date(`1970-01-01T${hrSettings.punchOutTime}`);

      const diff = punchOut - punchIn;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const duration = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

      console.log(`Organization ID: ${organization.id}, Duration: ${duration}`);

      // Fetch all employees
      const employees = await Emp_onboarding.findAll({
        where: { isDelete: false, orgnaizationId: organization?.id },
      });

      for (const employee of employees) {
        // Check if an attendance record already exists
        const existingAttendance = await Attendance.findOne({
          where: {
            empAttendence: employee.id,
            punch_in: {
              [Op.gte]: `${date} 00:00:00`,
              [Op.lt]: `${date} 23:59:59`,
            },
          },
        });

        if (!existingAttendance) {
          await Attendance.create({
            empAttendence: employee.id,
            punch_in: `${date} ${hrSettings?.punchInTime}`,
            punch_out: `${date} ${hrSettings?.punchOutTime}`,
            duration: duration,
            status: "Full Day",
            organizationId: employee.orgnaizationId,
          });

          console.log(`Attendance marked for employee ID: ${employee.id} on ${date}`);
        } else {
          console.log(`Attendance already exists for employee ID: ${employee.id} on ${date}`);
        }
      }
    }
  } catch (error) {
    console.error("Error updating attendance:", error);
  }
});


async function sendPlanNotifications(io) {
  try {
    const today = new Date();

    // Fetch organizations with plans expiring within the next 7 days for the reminder notification
    const organizationsExpiringSoon = await Organization.findAll({
      where: {
        planExpiryDate: {
          [Op.between]: [
            today,
            new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
          ], // Between today and 7 days from now
        },
      },
    });

    // Fetch organizations whose plans have expired but are still in the grace period
    const organizationsInGracePeriod = await Organization.findAll({
      where: {
        planExpiryDate: {
          [Op.lt]: today, // Expiry date is in the past
        },
        planGracePeriodEnd: {
          [Op.gt]: today, // Grace period is still active
        },
      },
    });

    // Send reminders for plans expiring soon
    for (const organization of organizationsExpiringSoon) {
      const {
        id: organizationId,
        name: organizationName,
        planExpiryDate,
      } = organization;

      // Fetch employees with the "Management" role
      const roleToNotify = "Management";
      const employeesToNotify = await Employee.findAll({
        where: {
          orgnaizationId: organizationId,
          role: roleToNotify,
        },
      });

      const notifications = employeesToNotify.map((user) => ({
        type: "Reminder",
        message: `The plan will expire on ${planExpiryDate.toDateString()}. Please renew to avoid service interruptions.`,
        adminId: user.id,
        userId: user.id,
      }));

      // Create notifications in the database
      const createdNotifications = await Notifications.bulkCreate(
        notifications,
        { returning: true }
      );

      // Emit notifications to users via socket
      employeesToNotify.forEach((user) => {
        const notification = createdNotifications.find(
          (n) => n.adminId === user.id
        );
        if (notification) {
          io.to(`${user.id}`).emit("notification", notification);
          console.log(`Reminder sent to adminId ${user.id}:`, notification);
        }
      });
    }

    // Send notifications for plans expired but still in the grace period
    for (const organization of organizationsInGracePeriod) {
      const {
        id: organizationId,
        name: organizationName,
        planExpiryDate,
        planGracePeriodEnd,
      } = organization;

      // Fetch employees with the "Management" role
      const roleToNotify = "Management";
      const employeesToNotify = await Employee.findAll({
        where: {
          orgnaizationId: organizationId,
          role: roleToNotify,
        },
      });

      const notifications = employeesToNotify.map((user) => ({
        type: "Reminder",
        message: `The plan expired on ${planExpiryDate.toDateString()}. Please renew to avoid service termination.`,
        adminId: user.id,
        userId: user.id,
      }));

      // Create notifications in the database
      const createdNotifications = await Notifications.bulkCreate(
        notifications,
        { returning: true }
      );

      // Emit notifications to users via socket
      employeesToNotify.forEach((user) => {
        const notification = createdNotifications.find(
          (n) => n.adminId === user.id
        );
        if (notification) {
          io.to(`${user.id}`).emit("notification", notification);
          console.log(
            `Plan expired notification sent to adminId ${user.id}:`,
            notification
          );
        }
      });
    }
  } catch (error) {
    console.error("Error sending plan notifications:", error);
  }
}

// Cron job to schedule the task
cron.schedule("00 10 * * *", (req) => {
  console.log("Running task at 5:25 PM");
  sendPlanNotifications(io); // Pass 'req' to the function
});

//google meet generate

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || "http://localhost:5173/oauth2callback";

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const SCOPES = ["https://www.googleapis.com/auth/calendar"];

app.get("/auth", (req, res) => {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
  res.redirect(authUrl);
});

let tokens;
try {
  tokens = JSON.parse(fs.readFileSync("tokens.json", "utf-8"));
  oAuth2Client.setCredentials(tokens);
} catch (error) {
  console.error("Error loading tokens:", error.message);
  console.log("Run /auth to generate new tokens.");
}

oAuth2Client.on("tokens", (newTokens) => {
  if (newTokens.refresh_token) {
    tokens.refresh_token = newTokens.refresh_token;
  }
  tokens.access_token = newTokens.access_token;
  fs.writeFileSync("tokens.json", JSON.stringify(tokens));
  console.log("Tokens updated and saved.");
});

app.get("/oauth2callback", async (req, res) => {
  const code = req.query.code;
  try {
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    // Save tokens to a file
    fs.writeFileSync("tokens.json", JSON.stringify(tokens));

    res.status(200).send("Authorization successful!");
  } catch (error) {
    console.error("Error during authentication:", error.message);
    res.status(500).send("Error during authentication: " + error.message);
  }
});

app.post("/create-meeting-api", async (req, res) => {
  try {
    const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

    const event = {
      summary: "Google Meet Test Meeting",
      description: "A test meeting scheduled via API.",
      start: {
        dateTime: "2025-01-10T10:00:00-07:00",
        timeZone: "America/Los_Angeles",
      },
      end: {
        dateTime: "2025-01-10T11:00:00-07:00",
        timeZone: "America/Los_Angeles",
      },
      conferenceData: {
        createRequest: {
          requestId: "random-string",
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    };

    const response = await calendar.events.insert({
      calendarId: "primary",
      resource: event,
      conferenceDataVersion: 1,
    });

    res.status(200).json({
      meetingLink: response.data.hangoutLink,
      eventId: response.data.id,
    });
  } catch (error) {
    console.error("Error creating meeting:", error);
    res.status(500).json({ error: error.message });
  }
});

// google meet generate

app.use("/api", userRoutes);

app.use("/api", reportSubmissionRoutes);
app.use("/api", salaryManagementRoutes);
app.use("/api", salaryAdvanceRoutes);
app.use("/api", hiringActivitiesRoutes);
app.use("/api", teamPerformanceRoutes);
app.use("/api", holidayCreationRoutes);
app.use("/api", praposalRoutes);
app.use("/api", managementCreationRoutes);
app.use("/api", invoiceManagementRoutes);
app.use("/api", leavesCreationRoutes);
app.use("/api", revenueRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", departmentRoutes);
app.use("/api", ModulesRoutes);
app.use("/api", attendenceRoutes);
app.use("/api", praposalServiceRoutes);
app.use("/api", empDocumentsRoutes);
app.use("/api", employeeExpensesRoutes);
app.use("/api", Meeting);
app.use("/api", notification);
app.use("/api", taskRoutes);
app.use("/api", employeeTask);
app.use("/api", empNotes);
app.use("/api", empTasks);
app.use("/api", projectRoutes);
app.use("/api", projectSprintsRoute);
app.use("/api", EmpsatisfactionSurveyRoutes);
app.use("/api", empPollRoutes);
app.use("/api", empResignationRoutes);
app.use("/api", gratuityRoutes);
app.use("/api", JobManagementRoutes);
app.use("/api", shiftCreationRoutes);
app.use("/api", TrainingRoutes);
app.use("/api", Datapoints);
app.use("/api", employeeFinalSettlement);
app.use("/api", Survey);
app.use("/api", leadCreation);
app.use("/api", invoiceModuleRoutes);
app.use("/api", expensesManagementCreationRoute);
app.use("/api", projectBoard);
app.use("/api", marketingStrategies);
app.use("/api", meeting_Mom);
app.use("/api", FAQ);
app.use("/api", marketingMeetingEve);
app.use("/api", InboundLeads);
app.use("/api", Client);
app.use("/api", blogsRoutes);
app.use("/api", triningModuleRoute);
app.use("/api", OrganizationRoute);
app.use("/api", renewelPlans);
app.use("/api", organizationSignUp);
app.use("/api", premiumPlans);
app.use("/api", phonepeRoute);
app.use("/api", contactForm);
app.use("/api", organizationInvoice);
// app.use("/api",contactForm);
app.use("/api", serviceRouter);
app.use("/api", SaapRoutes);
app.use("/api", testFormRoute);
app.use("/api", questionRoute);
app.use("/api", imageFigmaRoute);
app.use("/api", MainImageRoute);
app.use("/api", HrPanelRoute);
app.use("/api", sharedNotes);
// app.use("/api",kanbanAuto);
app.use("/api", EmployeeDocumentation);
app.use("/api", announcementRoute);
app.use("/api", couponsRoutes);
app.use('/api', fcmTokenRoute);
app.use("/api", projectDetailedRoutes);
app.use("/api", groupChatRoutes);
app.use("/api", chatRoutes);
app.use("/api", supportRoutes);
app.use("/api", adminSettingsRoute);

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

const _dirname = path.dirname("");
const buildPath = path.join(_dirname, "../client/dist");

app.use(express.static(buildPath));

app.get("/*", (req, res) => {
  // res.send("Welcome to the Employee Onboarding API");
  res.sendFile(
    path.join(__dirname, "../client/dist/index.html"),
    function (err) {
      if (err) {
        res.status(500).send(err);
      }
    }
  );
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

const shouldAlter = process.env.DB_ALTER === "true";
sequelize
  .sync({ alter: shouldAlter })
  .then(async () => {
    console.log(`Database synced (alter: ${shouldAlter})`);
    // Add job management columns that may not exist yet
    try {
      await sequelize.query(`ALTER TABLE "Job_Creations" ADD COLUMN IF NOT EXISTS department VARCHAR(255)`);
      await sequelize.query(`ALTER TABLE "Job_Creations" ADD COLUMN IF NOT EXISTS location VARCHAR(255)`);
      console.log("Job_Creations columns ensured.");
    } catch (err) {
      console.error("Job_Creations column migration error:", err.message);
    }
  })
  .catch((err) => {
    console.error("Unable to sync database:", err);
  });


// sequelize.authenticate()
//   .then(() => {
//     console.log("Database connected successfully!");

//     return sequelize.sync();
//   })
//   .then(() => {
//     console.log("Database models synced successfully!");

//     // Start the server
//     app.listen(PORT, () => {
//       console.log(`Server is running on http://localhost:${PORT}`);
//     });
//   })
//   .catch((err) => {
//     console.error("Error in server initialization:", err);
//     process.exit(1);
//   });

// server.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });
