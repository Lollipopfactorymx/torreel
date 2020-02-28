import React from 'react';
import GoogleMapReact from 'google-map-react';

const AnyReactComponent = ({ text }) => <div>{text}</div>;

class MapComponent extends React.Component {
	static defaultProps = {
		center: {
			lat: 19.193580,
			lng: -98.233927,
		},
		zoom: 15,
	};
	render() {
		return (
			<header className='login'>
				<div className='container-fluid vertical-center'>
					<div style={{ height: '85vh', width: '100%' }}>
						<GoogleMapReact bootstrapURLKeys={{ key: 'AIzaSyC2MkcqGqtBqIieudt1CImYtgVahLBJAA0' }} defaultCenter={this.props.center} defaultZoom={this.props.zoom}>
							<AnyReactComponent lat={this.props.center.lat} lng={this.props.center.lng} text='Torre EL' />
						</GoogleMapReact>
					</div>
				</div>
			</header>
		);
	}
}

export default MapComponent;
