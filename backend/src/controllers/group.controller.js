import cloudinary from "../lib/cloudinaryConfig.js";
import { io } from "../lib/socket.js";
import Group from "../models/group.model.js";
import Message from "../models/message.model.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const createGroup = async (req, res) => {
    try {
        // e.g. req.body = { name: "My Group", members: ["userId1", "userId2"] }
        const { name, members = [] } = req.body;

        // Optionally include the creating user as a member
        // if you want the creator automatically in the group.
        // e.g. members.push(req.user._id) if not already present
        if (!members.includes(req.user._id.toString())) {
            members.push(req.user._id);
        }

        const newGroup = new Group({
            name,
            members,
        });
        await newGroup.save();

        res.status(201).json(newGroup);
    } catch (error) {
        console.error("Error in createGroup:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const addMemberToGroup = async (req, res) => {
    console.log("addmembertogrp")
    try {
        const { groupId } = req.params;
        const { userId } = req.body;

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ error: "Group not found" });
        }

        if (!group.members.includes(userId)) {
            group.members.push(userId);
            await group.save();
        }

        res.status(200).json(group);
    } catch (error) {
        console.error("Error in addMemberToGroup:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const addMembers = async (req, res) => {
    console.log("addmembers");
    try {
        const { groupId } = req.params;
        const { userIds } = req.body;

        if (!Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ error: "Invalid or empty userIds array" });
        }

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ error: "Group not found" });
        }

        const newMembers = userIds.filter(userId => !group.members.includes(userId));

        if (newMembers.length > 0) {
            group.members.push(...newMembers);
            await group.save();
        }

        res.status(200).json(group);
    } catch (error) {
        console.error("Error in addMembersToGroup:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const deleteGroup = async (req,res) => {
    try {
        const { groupId } = req.params;
        const group = await Group.findById(groupId);

        await Group.findByIdAndDelete(groupId);
        res.status(200).json(group);
    } catch (error) {
        console.error("Error in deleteGroup:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

export const removeMemberFromGroup = async (req, res) => {
    try {
        const { groupId, userId } = req.params;
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ error: "Group not found" });
        }

        group.members = group.members.filter(
            (memberId) => memberId.toString() !== userId
        );
        await group.save();

        res.status(200).json(group);
    } catch (error) {
        console.error("Error in removeMemberFromGroup:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getGroupById = async (req, res) => {
    try {
        const { groupId } = req.params;

        const group = await Group.findById(groupId)
            .populate("members", "-password")
            .populate("messages");

        if (!group) {
            return res.status(404).json({ error: "Group not found" });
        }

        res.status(200).json(group);
    } catch (error) {
        console.error("Error in getGroupById:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getAllGroups = async (req, res) => {
    try {
        const groups = await Group.find({ members: req.user._id })
            .populate("members", "-password")
            .populate("messages");

        res.status(200).json(groups);
    } catch (error) {
        console.error("Error in getAllGroups:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};


export const sendGroupMessage = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { text, image } = req.body;
        const senderId = req.user._id;

        let imageUrl;
        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = new Message({
            senderId,
            group: groupId,
            text,
            image: imageUrl,
        });
        await newMessage.save();

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ error: "Group not found" });
        }
        group.messages.push(newMessage._id);
        await group.save();

        io.to(groupId).emit("groupMessage", newMessage);

        res.status(201).json(newMessage);
    } catch (error) {
        console.error("Error in sendGroupMessage:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getChatSummary = async (req, res) => {
    try {
        const encodedMessages = req.query.messages;

        if (!encodedMessages) {
            res.status(400).json({ error: "Messages parameter is required" });
            return;
        }

        const messages = JSON.parse(decodeURIComponent(encodedMessages));
        console.log("MESSAGES:", messages)
        if (!Array.isArray(messages)) {
            res.status(400).json({ error: "Invalid messages format" });
            return;
        }

        const chatData = JSON.stringify(messages, null, 2);
        console.log("CHAT DATA:", chatData);
        const prompt = `I have a group chat conversation in the form of an array of messages. Each message is an object containing text, time, and senderName. Please analyze and summarize the conversation efficiently while ensuring brevity.
        Key Guidelines:
        Extract the core discussion points and summarize/shorten redundant messages.
        Identify and attribute key actions, decisions, concerns or prepositions to the correct people.
        Condense long exchanges into short takeaways while retaining meaning.
        If there is humor, tension, or agreement/disagreement, briefly highlight it(required).
        Avoid summarizing trivial greetings or repeated confirmations unless significant.
        Format the summary naturally and fluently, making it quick to grasp.
        Understand the context/topic of discussion while providing summary.
        Use simple english/hinglish.Give only summary nothing else.
        Here is the chat data: ${chatData}`;

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const result = await model.generateContentStream(prompt);

        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        for await (const chunk of result.stream) {
            res.write(`data: ${chunk.text()}\n\n`);
        }

        res.end();
    } catch (error) {
        console.error("Error generating chat summary:", error);
        res.status(500).json({ error: "Failed to generate chat summary" });
    }
};