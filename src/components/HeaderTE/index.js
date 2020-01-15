import React from 'react';
import logo from '../../assets/images/logo.png'

class HeaderTE extends React.Component{
    render(){
        return (
            <header id="header">
                <div className="container-fluid vertical-center">
                    <img src={logo} alt="" className="img-responsive"></img>
                    <h1 className="color01 text-center">·Departamentos VIP a tu medida·</h1>
                </div>
            </header>
        )
    }
}


export default HeaderTE;