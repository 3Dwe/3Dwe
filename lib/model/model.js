//Made by Wei Lin, Delete and some callback functions courtesy of Tim Richard
var pg = require('pg');

var connString = 'postgres://postgres@localhost:5432/postgres';

// You can also configure the connection like this:
var connConfig = {
  user     : 'postgres',
  database : '3Dwe',
  password:  'password',
  port     : 5432,
  host     : 'localhost'
};

var conn = connConfig;

//query to add user to database
exports.addUser = function(email,fname, lname,password, callback) {
  pg.connect(conn, function (err, client, done) {
    if (err) {
      console.error(err);
      throw err;
    }
    //query to insert user
    var qry = 'insert into account (email,fname, lname, password) values ($1, $2, $3, $4) ' +
              'returning acc_id;';

    client.query(qry, [email,fname, lname, password],
                 function (err, result) {
                   // You can retrieve the row you inserted. This is very useful
                   // when you have SERIAL values:
                   done();
                   if (err) {
                     callback(err);
                   }
                   else {
                     callback(undefined);
                   }
    });
  });
};

exports.lookup = function(email, password, callback) {

    console.log("Preparing to pg connect");
    pg.connect(conn, function (err, client, done) {
        if (err) {
            console.log("Getting error in pg");
            console.error(err);
            throw err;
        }

        console.log("Preparing to query");
        //this query selects the email and password provided by the client on database
        var loginquery =  "select * from account where email = $1 and password = $2;";
        client.query(loginquery,[email, password], function (err,result) {
            done();
            if(result == undefined){
                err = true;
            }
            if (err) {
                callback(err);
            }
            else {
                callback(false,result.rows[0]);
            }
        });
    });
};

exports.deleteUser = function (email, callback) {
  pg.connect(conn, function (err, client, done) {
    if (err) {
      console.error(err);
      throw err;
    }
//not completely implement functions and queries, since the database for the pdf,video,audio, and etc. is not work yet.
    var q1 = "select acc_id from account where email = $1;";
    var q2 = "delete from account where acc_id = $1;";
    var q3 = "delete from audios where acc_id = $1;";
    var q4 = "delete from books where acc_id = $1;";
    var q5 = "delete from bookshelf where acc_id = $1;";
    var q6 = "delete from jukebox where acc_id = $1;";
    var q7 = "delete from photo_album where acc_id = $1;";
    var q8 = "delete from photos where acc_id = $1;";
    var q9 = "delete from tv where acc_id = $1;";
    var q10 = "delete from Videos where acc_id = $1;";
    client.query(q1, [email], function (err, res) {
      if (err) {
        done();
        callback(err);
      }
      else {
        var acc_id = res.rows[0].acc_id;
        client.query(q2, [acc_id], function (err, res) {
          if (err) {
            done();
            callback(err);
          }
          else {
            client.query(q3, [acc_id], function (err, res) {
              done();
              if (err) {
                callback(err);
              }
              else {
                callback(err, res);
              }
            });
          }
        });
      }
    });
  });
};
