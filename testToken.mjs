import { AccessToken } from "livekit-server-sdk";

const key = "APIcBTTKEgvKbKR";
const secret = "RTYGdKTfvad2UbSlNApj0kotS7cObx65UA8ONIfDJ9Q";

const token = new AccessToken(key, secret, { identity: "alex-test" });
token.addGrant({ roomJoin: true, room: "world-mic", canPublish: true, canSubscribe: true });

console.log(await token.toJwt()); // <-- toJwt() is async


