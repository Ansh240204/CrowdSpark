// backend/chat/chat.routes.js
const express = require("express");
const router = express.Router();
const Message = require("./chat.model");

// GET messages for a campaign
router.get("/", async (req, res) => {
  try {
    const { campaignId } = req.query;
    if (!campaignId) {
      return res.status(400).json({ error: "campaignId is required" });
    }

    const messages = await Message.find({ campaignId }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST a new message
router.post("/", async (req, res) => {
  try {
    const { campaignId, senderId, recipientId, content } = req.body;

    if (!campaignId || !senderId || !recipientId || !content) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const message = new Message({
      campaignId,
      senderId,
      recipientId,
      content,
    });

    await message.save();
    res.status(201).json(message);
  } catch (error) {
    console.error("Error saving message:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get('/unread/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const unreadCount = await Message.countDocuments({
      recipientId: userId,
      read: false
    });
    res.json({ unreadCount });
  } catch (err) {
    console.error("Error fetching unread count:", err);
    res.status(500).json({ error: "Server error" });
  }
});


// router.get('/notifications/:userId', async (req, res) => {
//   try {
//     const { userId } = req.params;

//     const messages = await Message.find({
//       recipientId: userId
//     })
//       .sort({ timestamp: -1 });

//     const notifications = messages.map(msg => ({
//       _id: msg._id,
//       senderId: msg.senderId._id,
//       senderName: msg.senderId.name,
//       campaignId: msg.campaignId._id,
//       campaignTitle: msg.campaignId.title,
//       content: msg.content,
//       timestamp: msg.timestamp,
//       read: msg.read 
//     }));

//     res.json({ notifications });
//   } catch (err) {
//     console.error("Error fetching notifications:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// });

router.get('/notifications/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const messages = await Message.find({
      recipientId: userId
    })
      .populate("campaignId", "title")
      .populate("senderId", "name")
      .sort({ timestamp: -1 });

    // Only include messages with both populated
    const notifications = messages
      .filter(msg => msg.senderId && msg.campaignId)
      .map(msg => ({
        _id: msg._id,
        senderId: msg.senderId._id,
        senderName: msg.senderId.name,
        campaignId: msg.campaignId._id,
        campaignTitle: msg.campaignId.title,
        content: msg.content,
        timestamp: msg.timestamp,
        read: msg.read,
      }));

    res.json({ notifications });
  } catch (err) {
    console.error("Error fetching notifications:", err.message);
    console.error(err.stack);
    res.status(500).json({ error: "Server error" });
  }
});



router.put("/mark-read/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    await Message.updateMany(
      { recipientId: userId, read: false },
      { $set: { read: true } }
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Error marking notifications as read:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete a single message
router.delete("/delete/:messageId", async (req, res) => {
  try {
    const { messageId } = req.params;

    await Message.findByIdAndDelete(messageId);

    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting message:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
