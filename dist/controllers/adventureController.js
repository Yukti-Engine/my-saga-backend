import pool from "../dbms/db.js";
import { isRelatedToAdventure, countMessages, getMessagesFromAToB, roomAvailable } from '../dbms/adventure-helpers.js';
import { getBoss } from '../dbms/boss-helpers.js';
import { getUser } from '../dbms/user-helpers.js';
import { getOrganizer } from "../dbms/organizer-helpers.js";
export const count = async (req, res) => {
    const { adventureId, id, role, accessToken } = req.body;
    let person;
    if (role == "organizer")
        person = await getOrganizer(id, pool);
    else if (role == "boss")
        person = await getBoss(id, pool);
    else
        person = await getUser(id, pool);
    if (person)
        if (person.access_token == accessToken && accessToken) {
            if (await isRelatedToAdventure(id, role, adventureId, pool))
                return res.json(await countMessages(adventureId, pool));
            return res.json({ success: false });
        }
        else
            return res.status(500).json({ "error": "Access token does not match" });
    else
        return res.status(500).json({ "error": "No such organizer" });
};
export const getMessages = async (req, res) => {
    const { adventureId, id, role, accessToken, a, b } = req.body;
    let person;
    if (role == "organizer")
        person = await getOrganizer(id, pool);
    else if (role == "boss")
        person = await getBoss(id, pool);
    else
        person = await getUser(id, pool);
    if (person)
        if (person.access_token == accessToken && accessToken) {
            if (await isRelatedToAdventure(id, role, adventureId, pool))
                return res.json(await getMessagesFromAToB(adventureId, a, b, pool));
            return res.json({ success: false });
        }
        else
            return res.status(500).json({ "error": "Access token does not match" });
    else
        return res.status(500).json({ "error": "No such organizer" });
};
export default function roomSocket(io, socket) {
    socket.on("join_room", (roomName) => {
        roomAvailable(roomName, pool).then((answer) => {
            if (answer) {
                socket.join(roomName);
                socket.to(roomName).emit("message", "A user has joined!");
            }
        });
    });
    socket.on("send_message", ({ room, message }) => {
        io.to(room).emit("message", message);
    });
    socket.on("leave_room", (roomName) => {
        socket.leave(roomName);
        socket.to(roomName).emit("message", "A user has left!");
    });
}
//# sourceMappingURL=adventureController.js.map