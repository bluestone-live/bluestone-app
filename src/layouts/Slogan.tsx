import React, { Component } from "react";
import "./Slogan.scss";
import m1 from "../assets/mountain1.svg";
import m2 from "../assets/mountain2.svg";
import m3 from "../assets/mountain3.svg";
import $ from "jquery";

class Slogan extends Component {
  private timer;
  private elements = [1, 2, 3];

  componentDidMount() {
    this.animate();
  }

  componentWillUnmount() {
    clearTimeout(this.timer);
  }

  private animate() {
    for (let i = 1; i <= 3; i++) {
      $(`#slogan${i}`).animate({ opacity: 0 });
      $(`#indicator${i}`).animate({ opacity: 0.5 });
      $(`#mountain${i}`)
        .delay(i === 0 ? 200 : 0)
        .animate({ opacity: 0.5, bottom: "-45px" });
    }

    const current = this.elements.shift()!;
    $(`#slogan${current}`).animate({ opacity: 1 });
    $(`#indicator${current}`).animate({ opacity: 1 });
    $(`#mountain${current}`).animate({ opacity: 1, bottom: "-2px" });
    this.elements.push(current);

    this.timer = setTimeout(() => this.animate(), 2400);
  }

  render() {
    return (
      <div className="slogan">
        <div className="text-container">
          <div className="text">
            <span id="slogan1">If the bank won’t lend, who will?</span>
            <span id="slogan2">An Ethereum protocol for fixed rate loan</span>
            <span id="slogan3">Launching soon</span>
          </div>

          <div className="indicators">
            <div id="indicator1" className="item"></div>
            <div id="indicator2" className="item"></div>
            <div id="indicator3" className="item"></div>
          </div>
        </div>

        <div className="img-container">
          <div className="mountains">
            <img id="mountain1" src={m1} alt="" />
            <img id="mountain2" src={m2} alt="" />
            <img id="mountain3" src={m3} alt="" />
          </div>
        </div>
      </div>
    );
  }
}

export default Slogan;
