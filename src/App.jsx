const React = require('react')

module.exports = class App extends React.Component {

  render() {
    const { component } = this.props

    return(
      <html>
        <head>
        </head>
        <body>
          <div id='content' dangerouslySetInnerHTML={{ '__html': component }}/>
        </body>
      </html>
    )
  }

}
