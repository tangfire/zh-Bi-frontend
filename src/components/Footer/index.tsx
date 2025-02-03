import { GithubOutlined } from '@ant-design/icons';
import { DefaultFooter } from '@ant-design/pro-components';
import React from 'react';

const Footer: React.FC = () => {
  return (
    <DefaultFooter
      style={{
        background: 'none',
      }}
      links={[
        {
          key: '智能 BI',
          title: '智能 BI',
          href: 'https://github.com/tangfire/zh-Bi-frontend',
          blankTarget: true,
        },
        {
          key: 'github',
          title: <GithubOutlined />,
          href: 'https://github.com/tangfire',
          blankTarget: true,
        },
        {
          key: '智能 BI',
          title: '智能 BI',
          href: 'https://github.com/tangfire/zh-Bi-backend',
          blankTarget: true,
        },
      ]}
    />
  );
};

export default Footer;
