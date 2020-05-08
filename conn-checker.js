"use strict";
const fs = require("fs");
const oracledb = require("oracledb");
const dbConfig = require("./dbconfig.js");

const msWait = 1000;
const numCycles = 3;

var slogfile = "/temp/conn-checker001.log";

// Output to file and console
function simpleout(rows) {
  console.log(rows);
  if (rows === Object) {
    for (var i = 0; i < rows.length; i++) {
      fs.writeFileSync(slogfile, rows[i] + "\r\n", { flag: "a" }, function (
        err
      ) {
        if (err) {
          return console.log(err);
        }
        //            console.log("The file was saved!");
      });
    }
  } else {
    fs.writeFileSync(slogfile, rows + "\r\n", { flag: "a" }, function (err) {
      if (err) {
        return console.log(err);
      }
    });
  }
}

const delay = (ms) =>
  new Promise((resolve, reject) => {
    setTimeout(() => resolve(`Done! ${ms}`), ms);
  });

async function run() {
  let connection, result;

  for (let i = 1; i <= numCycles; i++) {
    try {
      //delay
      const data = await delay(msWait);
      //Get connection
      connection = await oracledb.getConnection(dbConfig);

      //fetch data
      result = await connection.execute(
        `select TO_CHAR(sysdate,'YYYY.MM.DD HH24:MI:SS') dt, 'Connection to ' || host_name || ' OK' str, 0 iserror from v$instance `,
        []
        // outFormat determines whether rows will be in arrays or JavaScript objects.
        // It does not affect how the FARM column itself is represented.
        //        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      if (result.rows.length === 0) throw new Error("No results");
      else {
        // console.log(result.rows[0][0]);
        simpleout(result.rows);
      }
    } catch (err) {
      let dt = Date.now();
      let date_ob = new Date(dt);
      let day = ("0" + date_ob.getDate()).slice(-2);
      let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
      let year = date_ob.getFullYear();
      let hrs = ("0" + date_ob.getHours()).slice(-2);
      let min = ("0" + date_ob.getMinutes()).slice(-2);
      let sec = ("0" + date_ob.getSeconds()).slice(-2);

      const outArr = [];
      outArr.push(
        year + "." + month + "." + day + " " + hrs + ":" + min + ":" + sec
      );
      outArr.push(err.stack);
      outArr.push(1);
      simpleout(outArr);
      // console.log(err.message);
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (err) {
          // simpleout(err.);
          console.error(err);
        }
      }
    }
  }
}
run();
