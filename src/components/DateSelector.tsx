import { Component } from "react";
import "./DateSelector.scss";
import dayjs from "dayjs";
import sgc from "../assets/crypto/sgc.svg"

interface IProps {
    // recommends?: { days: number; apr: number | string }[];
    months?: number;
    maxDate?: Date;
    minDate?: Date;
    onSelect?: (date: Date) => void;
}

class DateSelector extends Component<IProps, {}> {
    state = {
        termList: [7, 30, 60, 180, 360],
        interestRateList: [0.02, 0.05, 0.08, 0.12, 0.15],
        term: undefined,
        interestRate: undefined,
    };

    clickListItem = (index: string) => {
        this.setState({
            term: this.state.termList[index],
            interestRate: this.state.interestRateList[index]
        });
        const future = dayjs().add(Number(this.state.termList[index] - 1), "day").toDate();
        this.props.onSelect?.(future);
    }

    render() {
        const { termList, interestRateList, term, interestRate } = this.state;
        let parameters = [] as any;
        for (let index in termList) {
            parameters.push(
                <article className="interest_term_board__profile" key={index} onClick={() => this.clickListItem(index)}>
                    <img src={sgc} alt="icon" className="interest_term_board__picture" />
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