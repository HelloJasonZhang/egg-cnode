'use strict';

const Controller = require('egg').Controller;
const validator = require('validator');
const _ = require('lodash');

class UserController extends Controller {
  async show() {
    const { ctx } = this;
    const loginname = ctx.params.loginname;
    const user = await ctx.service.user.getUserByLoginName(loginname);

    if (!user) {
      ctx.status = 404;
      ctx.body = { success: false, error_msg: '用户不存在' };
      return;
    }

    const userId = user._id;
    const topics = await ctx.service.topic.getTopicsByQuery({ author_id: userId });
    const returnUser = _.pick(user, [ 'loginname', 'avatar_url', 'githubUsername', 'create_at', 'score' ]);
    const returnTopics = topics.map(topic => {
      return {
        id: topic._id,
        last_reply_at: topic.last_reply_at,
        title: topic.title,
        author: {
          loginname: user.loginname,
          avatar_url: user.avatar_url,
        },
      };
    });
    const data = returnUser;
    data.recent_topics = returnTopics;
    ctx.body = {
      success: true,
      data,
    };
  }

  async verify() {
    const { ctx } = this;
    const user = ctx.request.user;
    ctx.body = {
      success: true,
      loginname: user.loginname,
      id: user._id,
      avatar_url: user.avatar_url,
    };
  }

  async login () {
    const { ctx } = this;
    const loginname = validator.trim(ctx.query.loginname || '');
    const pass = validator.trim(ctx.query.pass || '');

    const user = await ctx.service.user.getUserByLoginName(loginname);

    if (!user) {
      ctx.status = 404;
      ctx.body = { success: false, error_msg: '用户不存在' };
      return;
    } 

    if (ctx.helper.bcompare(pass, user.pass)) {
      ctx.body = {
        success: true,
        loginname: user.loginname,
        id: user._id,
        avatar_url: user.avatar_url,
        token: user.accessToken
      };
    } else {
      ctx.body = { success: false, error_msg: '密码数据错误' };
      return;      
    }
  }
}

module.exports = UserController;
