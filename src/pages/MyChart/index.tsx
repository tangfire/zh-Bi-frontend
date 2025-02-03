import {
  deleteChartUsingPost,
  listMyChartByPageUsingPost,
  reGenChartByAsyncMqUsingPost,
  showChartConclusionUsingPost,
} from '@/services/zhbi/chartController';
import { BarChartOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { useModel } from '@umijs/max';
import {
  Avatar,
  Button,
  Card,
  Form,
  Input,
  List,
  message,
  Modal,
  Popconfirm,
  Result,
  Select,
  Spin,
} from 'antd';
import { useForm } from 'antd/es/form/Form';
import Search from 'antd/es/input/Search';
import dayjs from 'dayjs';
import ReactECharts from 'echarts-for-react';
import React, { useEffect, useState } from 'react';

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
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<API.Chart | null>(null);

  const [conclusionModalVisible, setConclusionModalVisible] = useState(false);
  const [conclusionData, setConclusionData] = useState<string | null>(null);
  const [chartData, setchartData] = useState<string | null>(null);

  const [chartList, setChartList] = useState<API.Chart[]>();
  const [total, setTotal] = useState<number>(0);
  const { initialState } = useModel('@@initialState');
  const { currentUser } = initialState ?? {};
  const [loading, setLoading] = useState<boolean>(true);
  const [form] = useForm();

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

  const handleOpenModal = (item: API.Chart) => {
    setSelectedItem(item);
    setModalVisible(true);
    // 设置表单字段的值
    form.setFieldsValue({
      id: item.id,
      name: item.name,
      goal: item.goal,
      chartType: item.chartType,
      chartData: item.chartData,
    });
  };

  const handleCancelModal = () => {
    setModalVisible(false);
  };

  const handleSubmit = async (values: any) => {
    setModalVisible(false);
    try {
      const res = await reGenChartByAsyncMqUsingPost(values);
      if (!res?.data) {
        message.error('分析失败,' + `${res.message}`);
      } else {
        message.success('正在重新生成，稍后请在我的图表页面刷新查看');
        window.location.reload();
      }
    } catch (e: any) {
      message.error('分析失败，' + e.message);
    }
  };

  // const handleColusionOpenModal = async (chartId: number) => {
  //   setConclusionModalVisible(true);
  //   try {
  //     const val = { chartId };
  //     const res = await showChartConclusionUsingPost(val);
  //     // console.log(res)
  //     setConclusionData(res.data?.genResult ?? '');
  //     setchartData(res.data?.genChart ?? '');
  //   } catch (e: any) {
  //     message.error('结论分析失败，' + e.message);
  //   }
  // };

  const handleColusionOpenModal = async (chartId: number) => {
    setConclusionModalVisible(true);
    // 先将图表数据设置为初始状态
    setchartData(null);

    try {
      const val = { chartId };
      const res = await showChartConclusionUsingPost(val);

      // 使用 Promise.all 确保数据同时加载
      const [conclusionResult, chartResult] = await Promise.all([
        Promise.resolve(res.data?.genResult ?? ''),
        // 如果接口没有直接返回 genChart，可以从 chartList 中查找
        new Promise<string>((resolve) => {
          const matchedChart = chartList?.find((item) => item.id === chartId);
          resolve(matchedChart?.genChart ?? '{}');
        }),
      ]);

      setConclusionData(conclusionResult);
      setchartData(chartResult);
    } catch (e: any) {
      message.error('结论分析失败，' + e.message);
      // 确保即使出错也重置图表数据
      setchartData(null);
    }
  };

  const handleCancelConclusionModal = () => {
    setConclusionModalVisible(false);
  };

  const confirm = async (id: number) => {
    try {
      await deleteChartUsingPost({ id });
      message.success('删除成功');
      setSearchParams({ ...initSearchParams });
    } catch (e: any) {
      message.error('删除图表失败，' + e.message);
    }
  };

  return (
    <div className="my-chart-page">
      <div>
        <Search loading={loading} placeholder="" onSearch={onSearch} enterButton />
      </div>

      {/*<div style={{marginBottom: 16}}></div>*/}
      <div className="margin-16"></div>

      <Modal
        title="重新生成图表"
        visible={modalVisible}
        onCancel={handleCancelModal}
        width={600}
        footer={[
          <Button key="cancel" onClick={handleCancelModal}>
            取消
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={() => {
              form.submit();
            }}
          >
            重新生成
          </Button>,
        ]}
      >
        {selectedItem && (
          <Form form={form} onFinish={handleSubmit} layout="vertical">
            <Form.Item label="ID" name="id" initialValue={selectedItem.id} hidden>
              <Input disabled />
            </Form.Item>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Form.Item
                label="图表名称"
                name="name"
                initialValue={selectedItem.name}
                style={{ width: '48%' }}
                rules={[
                  {
                    required: true,
                    message: '请输入图表名称',
                  },
                ]}
              >
                <Input placeholder="请输入图表名称" />
              </Form.Item>

              <Form.Item
                label="分析目标"
                name="goal"
                initialValue={selectedItem.goal}
                style={{ width: '48%' }}
                rules={[
                  {
                    required: true,
                    message: '请输入分析目标',
                  },
                ]}
              >
                <Input placeholder="请输入分析目标" />
              </Form.Item>
            </div>

            <Form.Item
              label="图表类型"
              name="chartType"
              initialValue={selectedItem.chartType}
              rules={[
                {
                  required: true,
                  message: '请选择图表类型',
                },
              ]}
            >
              <Select
                placeholder="请选择图表类型"
                onChange={(value) => form.setFieldsValue({ chartType: value })}
              >
                {[
                  { value: '折线图', label: '折线图' },
                  { value: '平滑折线图', label: '平滑折线图' },
                  { value: '柱状图', label: '柱状图' },
                  { value: '堆叠图', label: '堆叠图' },
                  { value: '饼图', label: '饼图' },
                  { value: '散点图', label: '散点图' },
                ].map((item) => (
                  <Select.Option key={item.value} value={item.value}>
                    {item.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="原始数据"
              name="chartData"
              initialValue={selectedItem.chartData}
              rules={[
                {
                  required: true,
                  message: '请输入原始数据',
                },
              ]}
            >
              <Input.TextArea rows={10} placeholder="请输入原始数据" />
            </Form.Item>
          </Form>
        )}
      </Modal>

      <Modal
        // title="结论分析"
        visible={conclusionModalVisible}
        onCancel={handleCancelConclusionModal}
        width={800} // 增加弹窗宽度
        footer={[
          <Button key="cancel" onClick={handleCancelConclusionModal}>
            取消
          </Button>,
        ]}
      >
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="mb-4">
            <span
              style={{
                fontWeight: 'bold',
                color: 'black',
                fontSize: '18px', // 增大字体
                marginBottom: '8px', // 增加底部间距
                display: 'block', // 使其独占一行
              }}
            >
              可视化图表:
            </span>
            {chartData ? (
              <ReactECharts option={JSON.parse(chartData ?? '{}')} style={{ height: '400px' }} />
            ) : (
              <Spin
                tip="图表加载中..."
                className="w-full flex justify-center items-center h-[400px]"
              >
                <div>正在获取图表数据...</div>
              </Spin>
            )}
          </div>

          {/* 结论部分保持不变 */}
          <div className="mt-4">
            <span
              style={{
                fontWeight: 'bold',
                color: 'black',
                fontSize: '18px', // 增大字体
                marginBottom: '8px', // 增加底部间距
                display: 'block', // 使其独占一行
              }}
            >
              结论:
            </span>
            <div
              style={{
                fontSize: '16px', // 结论内容字体大小
                lineHeight: '1.6', // 增加行高提高可读性
                color: '#333', // 深灰色文字
                backgroundColor: '#f9f9f9', // 浅灰背景
                padding: '12px', // 内边距
                borderRadius: '8px', // 圆角
                border: '1px solid #e0e0e0', // 轻微边框
              }}
            >
              {conclusionData}
            </div>
          </div>
        </div>
      </Modal>

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
            <Card
              style={{ width: '100%' }}
              extra={dayjs(item.updateTime).format('YYYY-MM-DD HH:mm:ss')}
              actions={[
                <BarChartOutlined
                  key="barChartOutlined"
                  onClick={() => handleColusionOpenModal(item.id!)}
                />,
                <EditOutlined key="edit" onClick={() => handleOpenModal(item)} />,
                <Popconfirm
                  key="delete"
                  title="删除"
                  description="你是否要删除该图表?"
                  onConfirm={() => confirm(item.id!)}
                  okText="是"
                  cancelText="否"
                >
                  <DeleteOutlined />
                </Popconfirm>,
              ]}
            >
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
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <p style={{ margin: 0 }}>{'分析目标：' + item.goal}</p>

                      {/*<div>*/}
                      {/*  <Button*/}
                      {/*    style={{ marginRight: '5px' }}*/}
                      {/*    type="primary"*/}
                      {/*    onClick={() => handleOpenModal(item)}*/}
                      {/*  >*/}
                      {/*    修改诉求*/}
                      {/*  </Button>*/}

                      {/*  <Button*/}
                      {/*    style={{ marginRight: '5px' }}*/}
                      {/*    type="primary"*/}
                      {/*    onClick={() => handleColusionOpenModal(item.id!)}*/}
                      {/*  >*/}
                      {/*    结论分析*/}
                      {/*  </Button>*/}
                      {/*</div>*/}
                    </div>
                    <div style={{ marginBottom: 16 }} />

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
