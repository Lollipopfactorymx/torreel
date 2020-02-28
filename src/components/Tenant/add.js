import React from 'react';
import HeaderTE from '../HeaderTE';
import { withFirebase } from '../Firebase';
import SideBarAdmin from '../Admin/SidebarAdmin';
import { AuthUserContext, withAuthorization } from '../Session';
import * as ROUTES from '../../constants/routes';
import * as ROLES from '../../constants/roles';

class AddTenant extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            user:{},
            fullname: "",
            email: "",
            department: "",
            datepayment: "",
            amount: 0
        };
    }
    componentDidMount() {
        this.setState({ loading: true });
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange(event) {
        this.setState({
           [event.target.name]: event.target.value
        })
    }

    handleSubmit(event) {
        event.preventDefault();
        this.props.firebase
			.doCreateUserWithEmailAndPassword(this.state.email, '123456')
			.then(authUserR => {
				console.log("authUser ", authUserR);
				this.props.firebase.users().doc(authUserR.user.uid).set({
					fullname: this.state.fullname,
                    email: this.state.email,
                    department: this.state.department,
                    datepayment: this.state.datepayment,
                    amount: this.state.amount,
                    roles: [ROLES.INQUILINO]
				}).then(user => {
                    this.props.history.push(ROUTES.TENANT);
                });
			})
			.catch(error => {
				this.setState({ error });
			});        
      }

    render(){
        const { fullname, department, datepayment, email, amount } = this.state;
        return (
			<AuthUserContext.Consumer>
            {authUser => (
                <div>
                    <HeaderTE small='true' />
                    <div className='fondo-rayas container-fluid'>
                        <div className='row'>
                            <SideBarAdmin email={authUser.email}/>

                            <div className='col-xs-10 col-sm-9 col-md-10 '>
                                <img src={require('../../assets/images/vectores-fondo.png')} className='img-responsive imgfondoadmin' alt='' />
                                <div className='bubble-wrapper row text-center'>
                                    <div className='col-xs-1'>
                                        <div className='bubble-triangle'></div>
                                    </div>
                                    <div className='bubble col-xs-11 col-xs-offset-1 col-md-10 col-md-offset-0 col-lg-9 '>
                                        <h1>·Agregar Inquilino·</h1>
                                        <div id='inquilino' className='panel panel-default'>
                                            <div className='panel-body'>
                                                <div className='row' id='user'>
                                                    <form className="formInline" onSubmit={this.handleSubmit}>
                                                        <div className="form-group">
                                                            <label>Email</label>
                                                            <input type="text" name="email" value={email} className="form-control bg03" onChange={this.handleChange}></input>
                                                        </div>
                                                        <div className="form-group">
                                                            <label>Nombre</label>
                                                            <input type="text" name="fullname" value={fullname} className="form-control bg03" onChange={this.handleChange}></input>
                                                        </div>
                                                        <div className="form-group">
                                                            <label>Departamento</label>
                                                            <input type="text" name="department" value={department} className="form-control bg03" onChange={this.handleChange}></input>
                                                        </div>
                                                        <div className="form-group">
                                                            <label>Fecha de ingreso</label>
                                                            <input name="datepayment" type="date" value={datepayment} className="form-control bg03" onChange={this.handleChange}></input>
                                                        </div>
                                                        <div className="form-group">
                                                            <label>Monto</label>
                                                            <input name="amount" type="number" value={amount} className="form-control bg03" onChange={this.handleChange}></input>
                                                        </div>
                                                        <div className="form-group">
                                                            <button className="btn btn-success">Guardar</button>
                                                        </div>
                                                    </form>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            )}
            </AuthUserContext.Consumer>
        )
    }
}

const condition = authUser => !!authUser && !!authUser.roles[ROLES.ADMIN];;

export default withAuthorization(condition)(withFirebase(AddTenant));