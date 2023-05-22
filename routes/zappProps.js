var express = require('express');
var router = express.Router();
var fs = require('fs')
var zipper = require('zip-local');
const propMap = require('../config_templates/property-map.json');
const propMapKeys = Object.keys(propMap);

/* get properties listing. */
router.post('/getProps', function(req, res, next) {
  var comment = '';
  var line_tmp = '';
  var cobol = '';
  var assembler = '';
  var pli = '';
  var rexx = '';
  var db2 = '';
  var ims = '';
  var cics = '';
  var imsdc = '';
  var mq = '';
  var debug = '';
  var idz = '';
  var zunit = '';
  var transfer = '';
  var hide_boolean = false;

  const response = [];

  propFileFolder = '../' + req.body.folder + '/'
  if (process.platform === 'win32') propFileFolder = propFileFolder.replaceAll('/','\\');

  if (!fs.existsSync(propFileFolder)) {
    copyFolders();
  }
  
  if (req.body.properties.length != 0) {
    dir = "../" + req.body.properties[0].reqType;
    if (process.platform === 'win32') dir = dir.replaceAll('/','\\');
    writeFiles(dir,req.body.properties);
  }
  
  req.body.languages.forEach ( language => {
    if (language.name == 'Cobol') {
      cobol = language.completed; 
    } 
    if (language.name == 'Assembler') {
      assembler = language.completed; 
    } 
    if (language.name == 'PL/I') {
      pli = language.completed; 
    } 
    if (language.name == 'REXX') {
      rexx = language.completed; 
    } 
  });

  req.body.databases.forEach ( database => {
    if (database.name == 'DB2') {
      db2 = database.completed; 
    } 
    if (database.name == 'IMS') {
      ims = database.completed; 
    } 
  });

  req.body.subsystems.forEach ( subsystem => {
    if (subsystem.name == 'CICS') {
      cics = subsystem.completed; 
    } 
    if (subsystem.name == 'IMS DC') {
      imsdc = subsystem.completed; 
    } 
    if (subsystem.name == 'MQ') {
      mq = subsystem.completed; 
    } 
  });

  req.body.others.forEach ( other => {
    if (other.name == 'ZUnit') {
      zunit = other.completed; 
    }
    if (other.name == 'IBM Debug') {
      debug = other.completed; 
    }
    if (other.name == 'IDZ') {
      idz = other.completed; 
    }
    if (other.name == 'Transfer Files') {
      transfer = other.completed; 
    }
  });
  
  fs.readdir(propFileFolder, (err, files) => {
    files.forEach(file => {
      if (file.search(".properties") == -1) {
        return;
      }
      if (!cobol && file.toUpperCase() == 'COBOL.PROPERTIES') { return }
      if (!assembler && file.toUpperCase() == 'ASSEMBLER.PROPERTIES') { return }
      if (!pli && file.toUpperCase() == 'PLI.PROPERTIES') { return }
      if (!cobol && !assembler && !pli && file.toUpperCase() == 'LINKEDIT.PROPERTIES') { return }
      if (!rexx && file.toUpperCase() == 'REXX.PROPERTIES') { return }
      if (!ims && file.toUpperCase() == 'ACBGEN.PROPERTIES') { return }
      if (!ims && file.toUpperCase() == 'DBDGEN.PROPERTIES') { return }
      if (!ims && file.toUpperCase() == 'PSBGEN.PROPERTIES') { return }
      if (!db2 && file.toUpperCase() == 'BIND.PROPERTIES') { return }
      if (!cics && file.toUpperCase() == 'BMS.PROPERTIES') { return }
      if (!imsdc && file.toUpperCase() == 'MFS.PROPERTIES') { return }
      if (!zunit && file.toUpperCase() == 'ZUNITCONFIG.PROPERTIES') { return }
      if (!transfer && file.toUpperCase() == 'TRANSFER.PROPERTIES') { return }

      var fileResp = {'properties' : []}
      var prop_idx = 0;
      propFile = propFileFolder + file
  
      const propFileContents = fs.readFileSync(propFile, 'utf-8');

      propFileContents.split(/\r?\n/).forEach ( line =>  {
          if (line.trimStart().substr(0,1) == '#') {
            comment = comment + ' ' + line.trim().substr(1,line.trim().length);
          } else if (line.trimEnd().substr(-1,1) == '\\') {
            line_tmp = line_tmp + line.trim().substr(0,line.trim().length-1);
          } else if (line.trim() == '') {
            // Goto next line
          } else {
            line_tmp = line_tmp + line;
            key = line_tmp.substr(0,line_tmp.search("="));
            value = line_tmp.substr(line_tmp.search("=")+1);
           
            key_arr = [] 
            propMapKeys.forEach(propMapKey => {
              found = propMap[propMapKey].find(prop_key => prop_key.toUpperCase() == key)
              if (found) {
                key_arr.push(propMapKey)
              }
            });

            hide_boolean = false;
            key_arr.forEach(key_arr_sub => {
              if (!eval(key_arr_sub)) {hide_boolean = true};
            });

            fileResp['properties'].push({'idx': prop_idx, 'prop': key,'value' : value, 'comment' : comment, 'hidden' : hide_boolean});
            prop_idx = prop_idx + 1;
            comment = '';
            line_tmp = '';
          }
      }); 

      fileResp['reqType'] = req.body.folder
      fileResp['filename'] = file
      response.push(fileResp)
    });
    res.status(200).send(response)
  });      
});

/* Write properties listing. */
router.post('/writeProps', function(req, res, next) {
  var dir = "../" + req.body[0].reqType;
  if (process.platform === 'win32') dir = dir.replaceAll('/','\\');
  writeFiles(dir,req.body);

  zipfile = dir + ".zip"
  zipper.sync.zip(dir).compress().save(zipfile);
  res.status(200).download(zipfile);
});

router.get('/resetProps', function(req, res, next) {
  copyFolders();
  res.status(200).send({'resp' : 'Reset Complete!!!'});
});

router.get('/allBuildProps', function(req, res, next) {

  propFileFolder = '../build-conf/'
  if (process.platform === 'win32') propFileFolder = propFileFolder.replaceAll('/','\\');

  if (!fs.existsSync(propFileFolder)) {
    copyFolders();
  }

  var comment = '';
  var line_tmp = '';
  var fileResp = []
  
  fs.readdir(propFileFolder, (err, files) => {
    files.forEach(file => {
      if (file.search(".properties") == -1) {
        return;
      }
      
      
      propFile = propFileFolder + file
  
      const propFileContents = fs.readFileSync(propFile, 'utf-8');

      propFileContents.split(/\r?\n/).forEach ( line =>  {
          if (line.trimStart().substr(0,1) == '#') {
            comment = comment + ' ' + line.trim().substr(1,line.trim().length);
          } else if (line.trimEnd().substr(-1,1) == '\\') {
            line_tmp = line_tmp + line.trim().substr(0,line.trim().length-1);
          } else if (line.trim() == '') {
            // Goto next line
          } else {
            line_tmp = line_tmp + line;
            key = line_tmp.substr(0,line_tmp.search("="));
            value = line_tmp.substr(line_tmp.search("=")+1);

            fileResp.push({'prop': key,'value' : value, 'comment' : comment, 'reqType' : 'build-conf', 'filename' : file});
            comment = '';
            line_tmp = '';
          }
      }); 
    });
    res.status(200).send(fileResp);
  });
});

router.get('/allAppProps', function(req, res, next) {

  propFileFolder = '../application-conf/'
  if (process.platform === 'win32') propFileFolder = propFileFolder.replaceAll('/','\\');

  if (!fs.existsSync(propFileFolder)) {
    copyFolders();
  }

  var comment = '';
  var line_tmp = '';
  var fileResp = [];
  
  fs.readdir(propFileFolder, (err, files) => {
    files.forEach(file => {
      if (file.search(".properties") == -1) {
        return;
      }
      
      propFile = propFileFolder + file
  
      const propFileContents = fs.readFileSync(propFile, 'utf-8');

      propFileContents.split(/\r?\n/).forEach ( line =>  {
          if (line.trimStart().substr(0,1) == '#') {
            comment = comment + ' ' + line.trim().substr(1,line.trim().length);
          } else if (line.trimEnd().substr(-1,1) == '\\') {
            line_tmp = line_tmp + line.trim().substr(0,line.trim().length-1);
          } else if (line.trim() == '') {
            // Goto next line
          } else {
            line_tmp = line_tmp + line;
            key = line_tmp.substr(0,line_tmp.search("="));
            value = line_tmp.substr(line_tmp.search("=")+1);

            fileResp.push({'prop': key,'value' : value, 'comment' : comment,'reqType' : 'application-conf', 'filename' : file});
            comment = '';
            line_tmp = '';
          }
      }); 
    });
    res.status(200).send(fileResp);
  });
});

function copyFolders(){
  buildConfSrc = './config_templates/build-conf/';
  buildConfTgt = '../build-conf/';
  appConfSrc = './config_templates/application-conf/';
  appConfTgt = '../application-conf/';
  if (process.platform === 'win32') {
    buildConfSrc = buildConfSrc.replaceAll('/','\\');
    buildConfTgt = buildConfTgt.replaceAll('/','\\');
    appConfSrc = appConfSrc.replaceAll('/','\\');
    appConfTgt = appConfTgt.replaceAll('/','\\');
  };
  fs.rmSync(buildConfTgt, { recursive: true, force: true });
  fs.rmSync(appConfTgt, { recursive: true, force: true });
  
  fs.cpSync(buildConfSrc, buildConfTgt, {recursive: true});
  fs.cpSync(appConfSrc, appConfTgt, {recursive: true});
};

function writeFiles(dir,data){
  var datatmp = '';
  data.forEach(file => {
    datatmp = ''
    file.properties.forEach(property => {
       datatmp = datatmp + '# ' + property.comment.trim() + '\n';
       datatmp = datatmp + property.prop + '=' + property.value + '\n\n';
    });
    if (process.platform === 'win32') fs.writeFileSync('..\\' + file.reqType + '\\' + file.filename, datatmp);
    else fs.writeFileSync('../' + file.reqType + '/' + file.filename, datatmp);
  });

};


module.exports = router;
