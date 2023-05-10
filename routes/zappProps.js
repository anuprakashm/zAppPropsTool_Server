var express = require('express');
var router = express.Router();
var fs = require('fs')
var zipper = require('zip-local');

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
  var zunit = '';
  var transfer = '';

  const response = [];

  propFileFolder = './config_templates/' + req.body.folder + '/'
  if (process.platform === 'win32') propFileFolder = propFileFolder.replaceAll('/','\\')

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
  })

  req.body.databases.forEach ( database => {
    if (database.name == 'DB2') {
      db2 = database.completed; 
    } 
    if (database.name == 'IMS') {
      ims = database.completed; 
    } 
  })

  req.body.others.forEach ( other => {
    if (other.name == 'CICS') {
      cics = other.completed; 
    } 
    if (other.name == 'IMS DC') {
      imsdc = other.completed; 
    } 
    if (other.name == 'ZUnit') {
      zunit = other.completed; 
    }
    if (other.name == 'Transfer Files') {
      transfer = other.completed; 
    }
  })

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
            fileResp['properties'].push({'prop': key,'value' : value, 'comment' : comment});
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
  if (!fs.existsSync("../" + req.body[0].reqType)) {
    fs.mkdirSync("../" + req.body[0].reqType);
  }
  req.body.forEach(file => {
    datatmp = ''
    file.properties.forEach(property => {
       datatmp = datatmp + '# ' + property.comment + '\n';
       datatmp = datatmp + property.prop + '=' + property.value + '\n\n';
    });
    fs.writeFileSync('../' + file.reqType + '/' + file.filename, datatmp);
  })
  zipfile = "../" + req.body[0].reqType + ".zip"
  zipper.sync.zip("../" + req.body[0].reqType).compress().save(zipfile);
  res.status(200).download(zipfile);
});

module.exports = router;
