import { listMyChartByPageUsingPost } from '@/services/zhbi/chartController';
import { useModel } from '@umijs/max';
import { Avatar, Card, List, message, Result } from 'antd';
import Search from 'antd/es/input/Search';
import ReactECharts from 'echarts-for-react';
import React, { useEffect, useState } from 'react';
import dayjs from "dayjs";

/**
 * 我的图表页面
 * @constructor
 */
// shift + f6重构
const MyChartPage: React.FC = () => {
  const initSearchParams = {
    current: 1,
    pageSize: 4,
    sortField: 'createTime',
    sortOrder: 'desc',

  };

  const [searchParams, setSearchParams] = useState<API.ChartQueryRequest>({
    ...initSearchParams,
  });

  const [chartList, setChartList] = useState<API.Chart[]>();
  const [total, setTotal] = useState<number>(0);
  const { initialState } = useModel('@@initialState');
  const { currentUser } = initialState ?? {};
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await listMyChartByPageUsingPost(searchParams);
      if (res.data) {
        setChartList(res.data.records ?? []);
        setTotal(res.data.total ?? 0);

        // 有些图表有标题,有些没有,直接把标题全部去掉
        if (res.data.records) {
          res.data.records.forEach((data) => {
            if (data.status === 'succeed') {
              // 要把后端返回的图表字符串改为对象数组,如果后端返回空字符串，就返回'{}'
              const chartOption = JSON.parse(data.genChart ?? '{}');
              // 把标题设为undefined
              chartOption.title = undefined;
              // 然后把修改后的数据转换为json设置回去
              data.genChart = JSON.stringify(chartOption);
            }
          });
        }
      } else {
        message.error('获取我的图表失败');
      }
    } catch (e: any) {
      console.error('获取我的图表失败,' + e.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [searchParams]);

  /**
   * 搜索
   * @param value
   */
  const onSearch = (value: string) => {
    setSearchParams({
      // 设置搜索条件,回到第一页
      ...initSearchParams,
      name: value,
    });
  };



  return (
    <div className="my-chart-page">
      <div>
        <Search loading={loading} placeholder="input search text" onSearch={onSearch} enterButton />
      </div>

      {/*<div style={{marginBottom: 16}}></div>*/}
      <div className="margin-16"></div>

      <List
        loading={loading}
        grid={{ gutter: 16, xs: 1, sm: 1, md: 1, lg: 2, xl: 2, xxl: 2 }}
        pagination={{
          onChange: (page, pageSize) => {
            setSearchParams({
              ...searchParams,
              current: page,
              pageSize,
            });
          },
          current: searchParams.current,
          pageSize: searchParams.pageSize,
          total: total,
        }}
        dataSource={chartList}
        renderItem={(item) => (
          <List.Item key={item.id}>
            <Card style={{ width: '100%' }} extra={dayjs(item.updateTime).format('YYYY-MM-DD HH:mm:ss')}>
              <List.Item.Meta
                avatar={<Avatar src={currentUser && currentUser.userAvatar} />}
                title={item.name}
                description={item.chartType ? '图表类型:' + item.chartType : undefined}

              />

              {item.status === 'wait' && (
                <>
                  <Result
                    status="warning"
                    title="待生成"
                    subTitle={item.execMessage ?? '当前图表生成队列繁忙,请耐心等待'}
                  ></Result>
                </>
              )}

              {item.status === 'running' && (
                <>
                  <Result status="info" title="图表生成中" subTitle={item.execMessage}></Result>
                </>
              )}

              <>
                {item.status === 'succeed' && (
                  <>
                    <div style={{ marginBottom: 16 }}></div>
                    {'分析目标:' + item.goal}
                    <div style={{ marginBottom: 16 }}></div>

                    <ReactECharts option={JSON.parse(item.genChart ?? '{}')}></ReactECharts>
                  </>
                )}

                {item.status === 'failed' && (
                  <>
                    <Result
                      status="error"
                      title="图表生成失败"
                      subTitle={item.execMessage}
                    ></Result>
                  </>
                )}
              </>
            </Card>
          </List.Item>
        )}
      />
      <br />
    </div>
  );
};
export default MyChartPage;
