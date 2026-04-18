import cron from "node-cron";
import { archiveMatchRequests, cleanupExpiredPendingUsers, deactivateCompletedAdventures, logoutAbsentees, refreshBadgeRoadmaps } from "../controllers/adminController.js";

export function initSchedulers() {
  console.log("⏰ Initializing schedulers....");

  cron.schedule("0 0 * * *", async () => {
    console.log("Running archiveMatchRequests....");
    try {
      await archiveMatchRequests();
      console.log("archiveMatchRequests completed.");
    } catch (err) {
      console.error("archiveMatchRequests failed:", err);
    }
  });

  cron.schedule("0 * * * *", async () => {
    console.log("Running cleanupExpiredPendingUsers....");
    try {
      await cleanupExpiredPendingUsers();
      console.log("cleanupExpiredPendingUsers completed.");
    } catch (err) {
      console.error("cleanupExpiredPendingUsers failed:", err);
    }
  });

  cron.schedule("0 0 1 * *", async () => {
    console.log("Running logoutAbsentees....");
    try {
      await logoutAbsentees();
      console.log("logoutAbsentees completed.");
    } catch (err) {
      console.error("logoutAbsentees failed:", err);
    }
  });
  
  cron.schedule("0 0 * * *", async () => {
    console.log("Running deactivateCompletedAdventures....");
    try {
      await deactivateCompletedAdventures();
      console.log("deactivateCompletedAdventures completed.");
    } catch (err) {
      console.error("deactivateCompletedAdventures failed:", err);
    }
  });

  cron.schedule("0 2 * * 0", async () => {
    console.log("Running refreshBadgeRoadmaps....");
    try {
      await refreshBadgeRoadmaps();
      console.log("refreshBadgeRoadmaps completed.");
    } catch (err) {
      console.error("refreshBadgeRoadmaps failed:", err);
    }
  });

  console.log("⏰ Schedulers initialized.");
} 
