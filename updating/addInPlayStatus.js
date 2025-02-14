const request = require("request");
const MatchLive = require("../models/matchlive");
const getkeys = require("../utils/crickeys");

module.exports.addInPlayStatus = async function () {
    try {
        const keys = await getkeys.getkeys();
        const now = new Date();

        // Fetch matches that are ongoing but not marked as "Complete"
        const matches = await MatchLive.find({
            isInPlay: false,
            result: { $ne: "Complete" }
        });

        for (let match of matches) {
            const matchId = match.matchId;
            const format = match?.format?.toUpperCase();
            const lastUpdated = new Date(match.updatedAt);
            const matchDate = new Date(match.date);
            const elapsedTime = now - lastUpdated;

            let nextCheckTime = 10 * 60 * 1000; // Default: 10 minutes

            // 🔹 **Check if API request should be delayed**
            if (match.stumpsTime) {
                const stumpsNextCheck = new Date(matchDate);
                stumpsNextCheck.setDate(stumpsNextCheck.getDate() + 1); // Next day check

                if (now < stumpsNextCheck) {
                    console.log(`Skipping Match ${matchId}, Stumps time not reached.`);
                    continue;
                }
            }

            if (match.inningsBreakTime) {
                let inningsBreakDuration = format === "ODI" ? 30 * 60 * 1000 : 15 * 60 * 1000; // 30 min (ODI) or 15 min (T20)
                const inningsBreakNextCheck = new Date(match.inningsBreakTime.getTime() + inningsBreakDuration);

                if (now < inningsBreakNextCheck) {
                    console.log(`Skipping Match ${matchId}, innings break ongoing.`);
                    continue;
                }
            }

            // 🔹 API Request
            const options = {
                method: "GET",
                url: `https://cricbuzz-cricket.p.rapidapi.com/mcenter/v1/${matchId}`,
                headers: {
                    "x-rapidapi-host": "cricbuzz-cricket.p.rapidapi.com",
                    "X-RapidAPI-Key": '17394dbe40mshd53666ab6bed910p118357jsn7d63181f2556',
                    useQueryString: true,
                },
            };

            const promise = new Promise((resolve, reject) => {
                request(options, (error, response, body) => {
                    if (error) {
                        reject(error);
                    }
                    resolve(JSON.parse(body));
                });
            });

            promise
                .then(async (matchData) => {
                    if (!matchData || !matchData.matchInfo) return;

                    const matchState = matchData.matchInfo.state.toLowerCase();

                    if (matchState.includes("stumps")) {
                        console.log(`Match ${matchId} is in Stumps, setting next check for next day.`);
                        await MatchLive.updateOne({ matchId }, { isInPlay: false, stumpsTime: now });
                        return;
                    }

                    if (matchState.includes("innings break")) {
                        const breakDuration = format === "ODI" ? 30 * 60 * 1000 : 15 * 60 * 1000;
                        await MatchLive.updateOne({ matchId }, { inningsBreakTime: now });
                        console.log(`Match ${matchId} in innings break, checking after ${breakDuration / 60000} min.`);
                        return;
                    }

                    if (matchState.includes("in progress")) {
                        await MatchLive.updateOne({ matchId }, { isInPlay: true });
                        console.log(`Match ${matchId} resumed, updated isInPlay to true.`);
                    }
                })
                .catch((error) => console.log(`Error fetching match ${matchId}:`, error));
        }
    } catch (error) {
        console.log("Error in addInPlayStatus:", error);
    }
};

