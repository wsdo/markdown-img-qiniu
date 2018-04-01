'use babel';

import MarkdownImgQiniuView from './markdown-img-qiniu-view';
import { CompositeDisposable } from 'atom';
import clipboard from 'clipboard';
import { dirname, join} from 'path';
import fs from 'fs';

const delete_file = function(file_path) {
  return fs.unlink(file_path, function(err) {
    if (err) {
      return console.log('未删除本地文件:' + fullname);
    }
  });
};

const paste_mdtext = function(cursor, mdtext) {
  var position;
  cursor.insertText(mdtext);
  position = cursor.getCursorBufferPosition();
  position.column = position.column - mdtext.length + 2;
  return cursor.setCursorBufferPosition(position);
};
export default {

  markdownUpImgView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {
    this.markdownUpImgView = new MarkdownImgQiniuView(state.markdownUpImgViewState);
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.markdownUpImgView.getElement(),
      visible: false
    });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'markdown-img-qiniu:toggle': () => this.toggle(),
      'markdown-img-qiniu:upImg': () => this.upImg(),
      'markdown-img-qiniu:stark': () => this.stark()
    }));
  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.markdownUpImgView.destroy();
  },

  serialize() {
    return {
      markdownUpImgViewState: this.markdownUpImgView.serialize()
    };
  },

  toggle() {
    console.log('hi,guys,welcome  http://shudong.wang!');
    return (
      this.modalPanel.isVisible() ?
      this.modalPanel.hide() :
      this.modalPanel.show()
    );
  },
  stark() {
    atom.notifications.addSuccess('hi,guys,welcome  http://shudong.wang!');
  },
  upImg() {
    var assetsDirectory, bucket, curDirectory, cursor, domain, filePath, filename, fullname, grammar, img, key, mdtext, options, qiniu, request, token, uphost, uploadFile, uptoken;
    if (!(cursor = atom.workspace.getActiveTextEditor())) {
      return;
    }
    if (atom.config.get('markdown-img-qiniu.only_markdown')) {
      if (!(grammar = cursor.getGrammar())) {
        return;
      }
      if (cursor.getPath()) {
        if (cursor.getPath().substr(-3) !== '.md' && cursor.getPath().substr(-9) !== '.markdown' && grammar.scopeName !== 'source.gfm') {
          return;
        }
      } else {
        if (grammar.scopeName !== 'source.gfm') {
          return;
        }
      }
    }
    img = clipboard.readImage();
    if (img.isEmpty()) {
      return;
    }
    filename = atom.config.get('markdown-img-qiniu.filePrefix') + "-" + (new Date().format()) + ".png";
    curDirectory = dirname(cursor.getPath());
    fullname = join(curDirectory, filename);
    if (atom.config.get('markdown-img-qiniu.use_assets_folder')) {
      assetsDirectory = join(curDirectory, "assets") + "/";
      if (!fs.existsSync(assetsDirectory)) {
        fs.mkdirSync(assetsDirectory);
      }
      fullname = join(assetsDirectory, filename);
    }
    fs.writeFileSync(fullname, img.toPng());
    if (atom.config.get('markdown-img-qiniu.upload_to_mssm')) {
      request = require('request');
      options = {
        uri: 'https://sm.ms/api/upload',
        headers: {
          'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.143 Safari/537.36'
        },
        formData: {
          smfile: fs.createReadStream(fullname)
        }
      };
      request.post(options, function(err, response, body) {
        var mdtext;
        if (err) {
          return atom.notifications.addError('Upload failed:' + err);
        } else {
          console.log(body);
          body = JSON.parse(body);
          if (body.code === 'error') {
            return atom.notifications.addError('Upload failed:' + body.msg);
          } else {
            atom.notifications.addSuccess('OK, image upload to sm.ms!');
            mdtext = '![](' + body.data.url + ')';
            return paste_mdtext(cursor, mdtext);
          }
        }
      });
      delete_file(fullname);
      return;
    }
    if (!atom.config.get('markdown-img-qiniu.upload_to_qiniu')) {
      mdtext = '![](';
      if (atom.config.get('markdown-img-qiniu.use_assets_folder')) {
        mdtext += 'assets/';
      }
      mdtext += filename + ')';
      return paste_mdtext(cursor, mdtext);
    } else {
      qiniu = require('qiniu');
      qiniu.conf.ACCESS_KEY = atom.config.get('markdown-img-qiniu.zAccessKey');
      qiniu.conf.SECRET_KEY = atom.config.get('markdown-img-qiniu.zSecretKey');
      bucket = atom.config.get('markdown-img-qiniu.zbucket');
      domain = atom.config.get('markdown-img-qiniu.zdomain');
      key = filename;
      uptoken = function(bucket, key) {
        var putPolicy;
        putPolicy = new qiniu.rs.PutPolicy(bucket + ":" + key);
        return putPolicy.token();
      };
      token = uptoken(bucket, key);
      filePath = fullname;
      uphost = atom.config.get('markdown-img-qiniu.zuphost');
      if (uphost) {
        qiniu.conf.UP_HOST = uphost;
      }
      uploadFile = function(uptoken, key, localFile) {
        var extra;
        extra = new qiniu.io.PutExtra();
        return qiniu.io.putFile(uptoken, key, localFile, extra, function(err, ret) {
          var pastepath;
          if (!err) {
            atom.notifications.addSuccess('OK, image upload to qiniu!');
            pastepath = domain + '/' + filename;
            mdtext = '![](' + pastepath + ')';
            return paste_mdtext(cursor, mdtext);
          } else {
            atom.notifications.addError('Upload Failed:' + err.error);
            return console.log(err);
          }
        });
      };
      uploadFile(token, key, filePath);
      return delete_file(fullname);
    }
  }
};



Date.prototype.format = function() {
  var day, hour, minute, month, ms, second, shift2digits, year;
  shift2digits = function(val) {
    if (val < 10) {
      return "0" + val;
    }
    return val;
  };
  year = this.getFullYear();
  month = shift2digits(this.getMonth() + 1);
  day = shift2digits(this.getDate());
  hour = shift2digits(this.getHours());
  minute = shift2digits(this.getMinutes());
  second = shift2digits(this.getSeconds());
  ms = shift2digits(this.getMilliseconds());
  return "" + year + month + day + hour + minute + second + ms;
}
