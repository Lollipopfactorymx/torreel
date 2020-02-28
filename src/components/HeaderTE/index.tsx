import React from 'react';
import logo from '../../assets/images/logo.png'

interface HeaderTEProps {
    small?: string | boolean;
}

interface HeaderTEState {
    defaultClass: string;
}

class HeaderTE extends React.Component<HeaderTEProps, HeaderTEState> {
    constructor(props: HeaderTEProps) {
        super(props);

        this.state = {
            defaultClass: "header"
        }

        if (props.small) {
            this.state = {
                defaultClass: "header-min"
            }
        }

    }
    render() {
        return (
            <header className={this.state.defaultClass}>
                <div className="container-fluid vertical-center">
                    <img src={logo} alt="" className="img-responsive"></img>
                    <h1 className="color01 text-center">·Departamentos VIP a tu medida·</h1>
                </div>
            </header>
        )
    }
}


export default HeaderTE;