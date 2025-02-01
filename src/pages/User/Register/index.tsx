import { listChartByPageUsingPost } from '@/services/zhbi/chartController';
import {userRegisterUsingPost} from '@/services/zhbi/userController';
import { history, useModel } from '@umijs/max';
import {Button, Card, Form, Input, message} from 'antd';
import { createStyles } from 'antd-style';
import React, { useEffect } from 'react';

const useStyles = createStyles(({ token }) => {
  return {
    action: {
      marginLeft: '8px',
      color: 'rgba(0, 0, 0, 0.2)',
      fontSize: '24px',
      verticalAlign: 'middle',
      cursor: 'pointer',
      transition: 'color 0.3s',
      '&:hover': {
        color: token.colorPrimaryActive,
      },
    },
    lang: {
      width: 42,
      height: 42,
      lineHeight: '42px',
      position: 'fixed',
      right: 16,
      borderRadius: token.borderRadius,
      ':hover': {
        backgroundColor: token.colorBgTextHover,
      },
    },
    container: {
      display: 'flex',
      flexDirection: 'column',
      // justifyContent: 'center', // 垂直居中
      justifyContent: 'flex-start', // 改为向上对齐
      alignItems: 'center',      // 水平居中
      paddingTop: '100px',           // 添加顶部内边距
      height: '100vh',
      overflow: 'auto',
      backgroundImage:
        "url('https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/V-_oS6r-i7wAAAAAAAAAAAAAFl94AQBr')",
      backgroundSize: '100% 100%',
    },
  };
});
const Register: React.FC = () => {
  const { initialState} = useModel('@@initialState');
  const { styles } = useStyles();

  useEffect(() => {
    listChartByPageUsingPost({}).then((res) => {
      console.log('res', res);
    });
  });
  const onFinish = async (values:API.UserRegisterRequest) => {
    const res = await userRegisterUsingPost({
      ...values,
    })
    if (res.code === 0) {
      const defaultRegisterSuccessMessage = '注册成功！';
      message.success(defaultRegisterSuccessMessage);
      history.push("/user/login");
      return ;
    }else{
      message.error(res.message);
    }

    // console.log('register:', res);
  };

  const returnLogin = ()=>{
    history.push("/user/login");
  }



  return (
    <div className={styles.container}>
      <Card title="注册" style={ {width: 300} }>
        <Form
          name="basic"
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          style={{ maxWidth: 600 ,width: '100%' }}
          initialValues={{ remember: true }}
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            label="用户名"
            name="userAccount"
            rules={[{ required: true, message: '请输入你的用户名' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="userName"
            label="昵称"
            tooltip="你想让别人怎么称呼你?"
            rules={[{ required: true, message: '请输入你的昵称!', whitespace: true }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="userPassword"
            label="密码"
            rules={[
              {
                required: true,
                message: '请输入你的密码',
              },
            ]}
            hasFeedback
          >
            <Input.Password />
          </Form.Item>

          <Form.Item
            name="checkPassword"
            label="确认密码"
            dependencies={['userPassword']}
            hasFeedback
            rules={[
              {
                required: true,
                message: '请确认你的密码',
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('userPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>



          <Form.Item label={null}>
            <Button type="primary" htmlType="submit">
              Submit
            </Button>
          </Form.Item>

        </Form>

        <Button type="link" onClick={returnLogin}>返回</Button>

      </Card>
    </div>
  );
};
export default Register;
