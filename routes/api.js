/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb');
var ObjectId = require('mongodb').ObjectID;

const CONNECTION_STRING = process.env.DB; //MongoClient.connect(CONNECTION_STRING, function(err, db) {});

module.exports = function (app) {

  app.route('/api/issues/:project')
  
    .get(function (req, res){
      let project = req.params.project;
      let currentCollection = 'issue_' + project;

      if (req.query.open !== undefined)
        req.query.open = (req.query.open == 'true')

      MongoClient.connect(CONNECTION_STRING, function(err, client) {
        let db = client.db('test');
        db.collection(currentCollection).find(req.query).toArray((err,result)=>{
          if (err) throw err
          res.send(result)
        });
      });
    })
    
    .post(function (req, res){
      let project = req.params.project;
      let currentCollection = 'issue_'+project;

      if (req.body.issue_title == undefined |
          req.body.issue_text == undefined |
          req.body.created_by == undefined ){
        res.status(500)
        res.render('error', { error: 'Required text not filled' })
      }

      let created_on = new Date();
      let updated_on = created_on;
      let open = true;
      let newIssue = {
        issue_title: req.body.issue_title,
        issue_text:  req.body.issue_text,
        created_by:  req.body.created_by,
        assigned_to: req.body.assigned_to,
        status_text: req.body.status_text,
        created_on,
        updated_on,
        open
      }

      MongoClient.connect(CONNECTION_STRING, function(err, client) {
        
        let db = client.db('test');
        
        db.collection(currentCollection ).insertOne(newIssue,
          (err,doc) => {
            if (err){
              console.log('New issue: insertOne error')
            } else {
              console.log('Issued submited and saved')
              res.json(newIssue)
            }
          }
        )
      });
    })

    .put(function (req, res){
      let project = req.params.project;
      let currentCollection = 'issue_'+project;

      const updatedFields = {};
      const notEmpty = value =>(
        value != undefined &
        value != null &
        value != '' )

      Object.keys(req.body).forEach(key => {
        if (notEmpty(req.body[key])) {
          if (key=='open') {
            updatedFields[key] = (req.body[key] != 'false')
          } else {
            updatedFields[key] = req.body[key]
          }
        }
      });

      if (Object.keys(updatedFields).length <= 1) {
        // console.log('no updated field sent')
        res.send('no updated field sent')
      } else {
        updatedFields['updated_on'] = new Date();
        delete updatedFields['_id']
        // console.log(updatedFields)

        MongoClient.connect(CONNECTION_STRING, function(err, client) {
          
          let db = client.db('test');
          
          db.collection(currentCollection).findAndModify(
            {_id: ObjectId(req.body._id)},
            [],
            { $set: updatedFields }
            ,
            (err,doc) => {
              if (err){
                console.log(err)
                console.log('could not update '+req.body._id)
                res.send('could not update '+req.body._id)
              } else {
                console.log('Issue Updated')
                res.send('successfully updated')
              }
            }
          )
        });
      }


    })

    .delete(function (req, res){
      let project = req.params.project;
      let currentCollection = 'issue_'+project;

      if (req.body._id == undefined){
        res.send('_id error')
      } else {
        MongoClient.connect(CONNECTION_STRING, function(err, client) {
          
          let db = client.db('test');
          
          db.collection(currentCollection).findAndModify(
             {_id: ObjectId(req.body._id)},
             {},
             {},
             {remove:true}
            ,
            (err,doc) => {
              if (err){
                console.log(err)
                console.log('could not delete '+req.body._id)
                res.send('could not delete '+req.body._id)
              } else {
                console.log('deleted '+req.body._id)
                res.send('deleted '+req.body._id)
              }
          });
        });
      }
    });

};