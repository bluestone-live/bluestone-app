import "./Footer.scss";

import React, { Component } from "react";

import github from "../assets/social/github.svg";
import i18n from "../i18n";
import twitter from "../assets/social/twitter.svg";

class Footer extends Component {
  render() {
    return (
      <div className="footer">
        <div>
          <svg width="174px" height="24px" viewBox="0 0 174 24" version="1.1">
            <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
              <g transform="translate(-82.000000, -41.000000) scale(0.82 0.82)" fill="#002397">
                <g transform="translate(104.000000, 53.000000)">
                  <g>
                    <g
                      transform="translate(61.000000, 4.000000)"
                      fontFamily="PTMono-Bold, PT Mono"
                      fontSize="16"
                      fontWeight="bold"
                      letterSpacing="2.207143"
                    >
                      <text>
                        <tspan x="-1" y="14">
                          BlueStone
                        </tspan>
                      </text>
                    </g>
                    <g>
                      <g>
                        <polygon fillRule="nonzero" points="0 11.5 12.4329108 4.11492327 20.6973572 8.76734086 39.8302633 0 52 11.5" />
                        <path
                          d="M42.444,21.852 L39.8302633,24 L34.439,21.852 L42.444,21.852 Z M16.357,18.5 L12.573,20.352 L12.298,20.352 L8.713,18.5 L16.357,18.5 Z M46.524,18.5 L44.27,20.352 L30.675,20.352 L26.027,18.5 L46.524,18.5 Z M52,14 L48.958,16.5 L21.008,16.5 L20.6973572,16.3762253 L20.444,16.5 L4.84,16.5 L0,14 L52,14 Z"
                          fillRule="nonzero"
                          opacity="0.300000012"
                        />
                      </g>
                    </g>
                  </g>
                </g>
              </g>
            </g>
          </svg>
        </div>

        <div className="sections">
          <div className="section">
            <h3>{i18n.t("footer_title_products")}</h3>

            <ul>
              <li>
                <a href="/">Bluestone</a>
              </li>
            </ul>
          </div>

          <div className="section">
            <h3>{i18n.t("footer_title_docs")}</h3>

            <ul>
              <li>
                <a href="/assets/Bluestone_Whitepaper_v0.pdf">{i18n.t("footer_paper")}</a>
              </li>
              <li>
                <a href="https://docs.bluestone.live/">{i18n.t("footer_documents")}</a>
              </li>
            </ul>
          </div>

          <div className="section social">
            <h3>{i18n.t("footer_title_contacts")}</h3>
            <div>
              <a href="https://twitter.com/BluestoneDefi">
                <img src={twitter} alt="Bluestone Twitter" />
              </a>

              <a href="https://github.com/bluestone-live">
                <img src={github} alt="Bluestone Github" />
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Footer;
