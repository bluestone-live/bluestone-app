import './Calendar.scss';

import React, { Component } from 'react';

import { DateRange } from 'react-date-range';
import dayjs from 'dayjs';

const shortcuts = [
  {
    tag: '1 Week',
    value: 7,
  },
  {
    tag: '2 Weeks',
    value: 14,
  },
  {
    tag: '30 Days',
    value: 30,
  },
  {
    tag: '60 Days',
    value: 60,
  },
  {
    tag: '90 Days',
    value: 90,
  },
];

interface IProps {
  recommends?: { days: number; apr: number | string }[];
  months?: number;
  maxDate?: Date;
  minDate?: Date;
  onPreview?: (date: Date) => void;
  onSelect?: (date: Date) => void;
  onMouseOut?: () => void;
}

class Calendar extends Component<IProps, {}> {
  state = {
    ranges: [
      {
        startDate: new Date(),
        endDate: new Date(),
        key: 'selection',
      },
    ],
    preview: new Date(),
  };

  private initTimestamp = dayjs().hour(0);

  private fastSelect(days: number) {
    const future = this.initTimestamp.add(days, 'd').toDate();

    this.setState({
      ranges: [{ startDate: new Date(), endDate: future, key: 'selection' }],
    });

    this.props.onSelect?.(future);
  }

  render() {
    return (
      <div className="calendar" onMouseLeave={() => this.props.onMouseOut?.()}>
        <DateRange
          months={this.props.months || 1}
          direction="vertical"
          fixedHeight
          minDate={this.props.minDate || new Date()}
          maxDate={this.props.maxDate}
          moveRangeOnFirstSelection={true}
          color="#ff6dc4"
          rangeColors={['#ff6dc4']}
          ranges={this.state.ranges}
          scroll={{ enabled: true }}
          preview={{ startDate: new Date(), endDate: this.state.preview }}
          onChange={(item) => {
            this.setState({
              ranges: [
                {
                  startDate: new Date(),
                  endDate: this.state.preview || new Date(),
                  key: 'selection',
                },
              ],
            });
            this.props.onSelect?.(this.state.preview);
          }}
          onPreviewChange={(range) => {
            this.setState({ preview: range || this.state.preview });
            this.props.onPreview?.(range);
          }}
        />

        <div className="subtitle">Quick selections</div>
        <div className="shortcuts">
          {shortcuts.map((v) => {
            return (
              <div key={v.tag} onClick={(_) => this.fastSelect(v.value)}>
                {v.tag}
              </div>
            );
          })}
        </div>

        {this.props.recommends ? (
          <div className="recommends">
            <div className="subtitle">Recommended</div>

            <div className="items">
              {this.props.recommends.map((r) => {
                return (
                  <div className="item" key={r.days} onClick={(_) => this.fastSelect(r.days)}>
                    <span>{`${r.days} Days`}</span>
                    <span>{`APR: ${r.apr}%`}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : undefined}
      </div>
    );
  }
}

export default Calendar;
