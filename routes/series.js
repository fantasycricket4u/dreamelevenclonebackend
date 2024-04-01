const MatchLive = require("../models/matchlive");
const Player = require("../models/players");
var express = require("express");
const Withdraw = require("../models/withdraw");
const Match = require("../models/match");
const { getflag } = require("../utils/getflags");
const router = express.Router();
const flagURLs = require("country-flags-svg");
const MatchLiveDetails = require("../models/matchlive");

router.get("/allplayers", async (req, res) => {
    const players = await Player.find();
    res.status(200).json({
        message: "players got successfully",
        player: players
    });
});

router.get("/updatePlayers", async (req, res) => {
    const p = await Player.updateMany({}, { flagUrls: [] })
    const players = await Player.find();
    for (let i = 0; i < players?.length; i++) {
        try {
            for (let j = 0; j < players[i]?.teamIds.length; j++) {
                let home = await Match.findOne({ teamHomeId: players[i].teamIds[j] })
                let away = await Match.findOne({ teamAwayId: players[i].teamIds[j] })
                if (home) {
                    if (!players[i]?.flagUrls.includes(home.teamHomeFlagUrl)) {
                        players[i].flagUrls.push(home.teamHomeFlagUrl)
                    }
                }
                else if (away) {
                    if (!players[i]?.flagUrls.includes(away.teamAwayFlagUrl)) {
                        players[i].flagUrls.push(away?.teamAwayFlagUrl)
                    }
                }
            }
            await players[i].save()
        }
        catch (e) {
            console.log(e)
        }
    }
    res.status(200).json({
        message: "players got successfully",
        player: players
    });
});

router.get("/updateFlags", async (req, res) => {
    const m = await Match.updateMany({}, { teamAwayFlagUrl: "", teamHomeFlagUrl });
    const matches = await Match.find();
    for (let i = 0; i < matches?.length; i++) {
        try {
            let teamAwayFlagUrl = flagURLs.findFlagUrlByCountryName(
                matches[i].teamAwayName
            );
            let teamHomeFlagUrl = flagURLs.findFlagUrlByCountryName(
                matches[i].teamHomeName
            );
            if (!teamHomeFlagUrl) {
                matches[i].teamHomeFlagUrl = getflag(matches[i]?.teamHomeName);
            }
            else {
                matches[i].teamHomeFlagUrl = teamHomeFlagUrl;
            }
            if (!teamAwayFlagUrl) {
                matches[i].teamAwayFlagUrl = getflag(matches[i]?.teamAwayName);
            }
            else {
                matches[i].teamAwayFlagUrl = teamAwayFlagUrl;
            }
            await matches[i].save();
        }
        catch (e) {
            console.log(e)
        }
    }
    res.status(200).json({
        message: "matches flags updated successfully",
        player: matches
    });
});

router.get("/seriesDetails/:name", async (req, res) => {
    //const series = await Match.find({ matchTitle: req.params.name });
    let series = await Match.aggregate(
        [{ $match: { matchTitle: req.params.name, date: { $lt: new Date() }, } },
        {
            $lookup: {
                from: "matchlivedetails",//your schema name from mongoDB
                localField: "matchId", //user_id from user(main) model
                foreignField: "matchId",//user_id from user(sub) model
                as: "matchlive"//result var name
            }
        },]
    ).sort({ date: -1 });
    let topscorer;
    let allplayers = [];
    series.forEach((s) => {
        s.matchlive[0].teamAwayPlayers.forEach((p) => allplayers.push({ ...p, teamName: s.teamAwayName }))
        s.matchlive[0].teamHomePlayers.forEach((p) => allplayers.push({ ...p, teamName: s.teamHomeName }))
    }
    );
    sortingplayers = []
    allplayers.forEach((p) => {
        let player = allplayers.filter((pl) => pl.playerId == p.playerId)
        let runs = player.reduce((accumulator, currentValue) => accumulator + currentValue.runs,
            0);
        let wickets = player.reduce((accumulator, currentValue) => accumulator + currentValue.wickets,
            0);
        let sixes = player.reduce((accumulator, currentValue) => accumulator + currentValue.sixes,
            0);
        let fours = player.reduce((accumulator, currentValue) => accumulator + currentValue.fours,
            0);
        let strikeRate = player.reduce((accumulator, currentValue) => accumulator + currentValue.strikeRate,
            0) / player?.length;
        let x = {
            playerId: player[0].playerId, image: player[0]?.image, playerName: player[0].playerName, totalScore: runs,
            totalWickets: wickets, totalSixes: sixes, totalFours: fours, strikeRate: strikeRate,
            teamName: player[0].teamName
        }
        if (!sortingplayers.find((s) => s.playerId == x.playerId)) {
            sortingplayers.push(x)
        }
    });
    try {
        res.status(200).json({
            message: "series details got successfully",
            series: series,
            sortedplayers: sortingplayers
        });
    }
    catch (e) {
        res.status(200).json({
            message: "series failed"
        });
    }
});

router.get("/updatedatabase", async (req, res) => {
    try {
        const allmatches = await MatchLive.find();
        console.log(allmatches?.length, 'lengthe')
        for (let i = 0; i < allmatches?.length; i++) {
            for (let k = 0; k < allmatches[i]?.teamAwayPlayers?.length; + k++) {
                await Player.create({
                    name: allmatches[i].teamAwayPlayers[k].playerName,
                    id: allmatches[i].teamAwayPlayers[k].playerId,
                    image: allmatches[i].teamAwayPlayers[k].image,
                    teamId: allmatches[i].teamAwayId
                })
            }
            for (let k = 0; k < allmatches[i]?.teamHomePlayers?.length; + k++) {
                await Player.create({
                    name: allmatches[i].teamHomePlayers[k].playerName,
                    id: allmatches[i].teamHomePlayers[k].playerId,
                    image: allmatches[i].teamHomePlayers[k].image,
                    teamId: allmatches[i].teamHomeId
                })
            }
        }
        res.status(200).json({
            message: "players added successfully",
        });
    }
    catch (e) {
        console.log(e);
        res.status(400).json({
            message: e,
        });
    }
});

module.exports = router;