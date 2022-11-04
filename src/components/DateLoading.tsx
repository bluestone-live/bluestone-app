import "./DateLoading.scss";

const dateLoading = () => {
    return (
        <div className="interest_term_board">
            <div className="title">Select Term</div>
            <div className="flex-center-box">
                <div className="orbit-spinner">
                    <div className="orbit"></div>
                    <div className="orbit"></div>
                    <div className="orbit"></div>
                </div>
            </div>
        </div>
    )
};

export default dateLoading;