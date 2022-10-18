import { Component } from "react";
import "./DateSelector.scss";
import dayjs from "dayjs";
import sgc from "../assets/crypto/sgc.svg"
import graySgc from "../assets/components/gray_sgc.svg";

interface IProps {
    // recommends?: { days: number; apr: number | string }[];
    // months?: number;
    termList: string[];
    interestRateList: string[];
    maxDate?: Date;
    minDate?: Date;
    onPreview?: (date: Date) => void;
    onSelect?: (date: Date) => void;
}

class DateSelector extends Component<IProps, {}> {
    state = {
        term: undefined,
        interestRate: undefined,
    };

    clickListItem = (index: string) => {
        this.setState({
            term: this.props.termList[index],
            interestRate: this.props.interestRateList[index]
        });
        const future = dayjs().add(Number(this.props.termList[index] - 1), "day").toDate();
        this.props.onSelect?.(future);
        this.props.onPreview?.(future);
    }

    render() {
        const { termList, interestRateList } = this.props;
        const { term, interestRate } = this.state;
        let parameters = [] as any;
        for (let index in termList) {
            parameters.push(
                <article className="interest_term_board__profile" key={index} onClick={() => this.clickListItem(index)}>
                    <img src={term === termList[index] ? sgc : graySgc} alt="icon" className="interest_term_board__picture" />
                    <span className="interest_term_board__name">{termList[index]}<span>Days</span></span>
                    <span className="interest_term_board__value">{interestRateList[index]}<span>%</span></span>
                </article>
            );
        }
        return (
            <article className="interest_term_board">
                <div className="title">Select Term</div>

                <header>
                    <h1 className="interest_term_board__title">
                        <span className="interest_term_board__title--top">
                            {term} Days
                        </span>
                        <span className="interest_term_board__title--bottom">
                            {interestRate} %
                        </span>
                    </h1>
                </header>

                <main className="interest_term_board__profiles">
                    {parameters}
                </main>
            </article>
        )
    }
}

export default DateSelector;