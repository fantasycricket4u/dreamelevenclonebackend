const Match = require("../models/match");
const request = require("request");
const Contest = require("../models/contest");
const MatchLive = require("../models/match_live_details_new");
const User = require("../models/user");
const Player = require("../models/players");
const axios = require("axios");
const addplayers = require("./addplayerstwo");
const getkeys = require("../apikeys");

// function prizeBreakupRules(prize, numWinners){
//     let prizeMoneyBreakup = [];
//     for(let i = 0; i < numWinners; i++){

//     }
// }

function compare(a, b) {
  return a.date < b.date;
}

let io = 1;
async function getplayerImage(name) {
  console.log(name);
  return "https://cdn.sportmonks.com/images/cricket/placeholder.png";
}

module.exports.addLivematchtodb = async function () {
  const turing = await MatchLive();
  let date = new Date();
  let endDate = new Date(
    date.getTime() + 5.5 * 60 * 60 * 1000 + 0.6 * 60 * 60 * 1000
  );
  date = new Date(date.getTime() + 4.5 * 60 * 60 * 1000);
  const matches = await Match.find({
    date: {
      $gte: new Date(date),
      $lt: new Date(endDate),
    },
  });
  console.log(matches, "matches");
  for (let i = 0; i < matches.length; i++) {
    let matchId = matches[i].matchId;
    let match = await MatchLive.findOne({ matchId: matchId });
    if (match) {
      console.log("image");
    } else {
      let keys = await getkeys.getkeys();
      const date1 = "2679243";
      const options = {
        method: "GET",
        url: `https://cricket-live-data.p.rapidapi.com/match/${matchId}`,
        headers: {
          "x-rapidapi-host": "cricket-live-data.p.rapidapi.com",
          "X-RapidAPI-Key": keys,
          useQueryString: true,
        },
      };
      const user = await User.findById("63c18c9f2d217ea120307e30");
      user.totalhits = user.totalhits + 1;
      await user.save();
      let promise = new Promise((resolve, reject) => {
        request(options, function (error, response, body) {
          if (error) {
            reject(error);
          }
          let s = JSON.parse(body);

          resolve(s);
        });
      });
      promise
        .then(async (s) => {
          console.log(s?.results?.live_details?.teamsheets, s, "s");
          try {
            if (
              s.results.live_details != null &&
              s.results.live_details.teamsheets.home.length != 0
            ) {
              let LiveMatchDet = new MatchLive();
              LiveMatchDet.matchId = matchId;
              LiveMatchDet.date = date1;

              for (let x of s.results.live_details.teamsheets.home) {
                if (x.position == "Unknown") {
                  x.position = "Batsman";
                }

                let im = await getplayerImage(x.player_name);
                let playerDet = {
                  playerId: x.player_id,
                  playerName: x.player_name,
                  points: 4,
                  image: im,
                  position: x.position,
                };
                LiveMatchDet.teamHomePlayers.push(playerDet);
              }

              for (let x of s.results.live_details.teamsheets.away) {
                if (x.position == "Unknown") {
                  x.position = "Batsman";
                }

                let im = await getplayerImage(x.player_name);
                let playerDet = {
                  playerId: x.player_id,
                  playerName: x.player_name,
                  points: 4,
                  image: im,
                  position: x.position,
                };

                LiveMatchDet.teamAwayPlayers.push(playerDet);
              }
              let match = await MatchLive.create(LiveMatchDet);
              if (match) {
                console.log(
                  "Live Details of match is successfully added in db! "
                );
                addplayers.addPlayers();
              }
            }
          } catch (err) {
            console.log(err);
          }
        })
        .catch((error) => console.log(error));
    }
  }
};
