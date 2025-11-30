import { Tabs } from 'antd';
import styled from 'styled-components';

const StyledTabs = styled(Tabs)`
  .ant-tabs-nav {
    margin-bottom: 0 !important;
  }

  .ant-tabs-tab {
    padding: 10px 20px !important;
    font-size: 14px !important;
    transition: all 0.2s ease !important;
    border-radius: 8px 8px 0 0 !important;
    border-bottom: 2px solid transparent !important;
  }

  .ant-tabs-tab:first-child {
    .ant-tabs-tab-btn {
      color: #059669 !important;
    }

    &:hover {
      border-bottom-color: #059669 !important;
    }

    &.ant-tabs-tab-active {
      border-color: #e8e8e8 !important;
      border-bottom-color: #fff !important;

      .ant-tabs-tab-btn {
        font-weight: 600 !important;
      }
    }
  }

  .ant-tabs-tab:nth-child(2) {
    .ant-tabs-tab-btn {
      color: #059669 !important;
    }

    &:hover {
      border-bottom-color: #059669 !important;
    }

    &.ant-tabs-tab-active {
      border-color: #e8e8e8 !important;
      border-bottom-color: #fff !important;

      .ant-tabs-tab-btn {
        font-weight: 600 !important;
        color: #059669 !important;
      }
    }
  }

  .ant-tabs-content-holder {
    padding: 16px 0 0 0 !important;
    border-top: 1px solid #e8e8e8;
  }

  .ant-tabs-content {
    padding: 0 !important;
  }
`;

export default StyledTabs;
