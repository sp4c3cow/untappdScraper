import React, { Component } from 'react'
import { Tooltip } from 'react-tippy'
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {faQuestionCircle, faWineBottle} from '@fortawesome/free-solid-svg-icons'
import LoadingIcon from './../assets/logos/single_glass.png'
import logoImg from './../assets/logos/logo-untapped.png'
import { getUntappdOsint, loadGoogleMapsClient, daysOfWeek, formatHour } from '../lib/utils'
import Table from './../components/Table'
import Chart from './../components/Chart'
// needed for styling static data on the page
import mockData from '../mockData'
const timeFormat = 'DD MMM YY HH:mm:ss Z'

const sortNumberEntries = (a, b) => {
  const aNumber = parseInt(a[0], 10)
  const bNumber = parseInt(b[0], 10)

  if (aNumber < bNumber) {
    return -1
  }

  if (aNumber > bNumber) {
    return 1
  }

  return 0
}

const getHourPriority = (numString) => {
  const num = parseInt(numString, 10)

  let priority = num - 7

  if (priority < 0) {
    priority = 24 + priority
  }

  return priority
}

const sortHourEntries = (a, b) => {
  // Sort from 07:00 to 06:00.
  const aPriority = getHourPriority(a[0])
  const bPriority = getHourPriority(b[0])

  if (aPriority < bPriority) {
    return -1
  }

  if (aPriority > bPriority) {
    return 1
  }

  return 0
}

const sortDayEntries = (a, b) => {
  const aIndex = daysOfWeek.indexOf(a[0])
  const bIndex = daysOfWeek.indexOf(b[0])

  if (aIndex < bIndex) {
    return -1
  }

  if (aIndex > bIndex) {
    return 1
  }

  return 0
}

const makeChartData = (initialData) => {
  const newData = Object.entries(initialData).reduce((acc, cur) => {
    const [dayWeek, beers] = cur
    return [...acc, {x: dayWeek, y: beers}]
  }, [])
  return newData
}

export default class Index extends Component {
  constructor () {
    super()

    this.state = {
      username: '',
      recentActivityOnly: false,
      googleMapsApiKey: '',
      googleMapsClient: null,
      loadingGoogleMapsClient: false,
      data: null,
      error: null,
      submitting: false,
      loading: false
    }
  }

  updateUsername (e) {
    this.setState({
      username: e.target.value
    })
  }

  updateRecentActivityOnly () {
    this.setState({
      recentActivityOnly: !this.state.recentActivityOnly
    })
  }

  updateGoogleMapsApiKey (e) {
    this.setState({
      googleMapsApiKey: e.target.value
    })
  }

  async getUntappdOsint (e) {
    e.preventDefault()

    this.setState({
      data: null,
      error: null,
      submitting: true,
      loading: true
    })

    const username = this.state.username.trim()
    const recentActivityOnly = this.state.recentActivityOnly
    const googleMapsClient = this.state.googleMapsClient

    if (username) {
      try {
        const data = await getUntappdOsint(username, recentActivityOnly, googleMapsClient)

        this.setState({
          data,
          username: '',
          submitting: false,
          loading: false
        })
      } catch (err) {
        this.setState({
          error: err.toString(),
          submitting: false,
          loading: false
        })
      }
    } else {
      this.setState({
        error: 'Must provide a username.',
        submitting: false,
        loading: false
      })
    }
  }

  async setupGoogleMapsClient (e) {
    e.preventDefault()

    this.setState({
      loadingGoogleMapsClient: true,
      submitting: true
    })

    const googleMapsApiKey = (this.state.googleMapsApiKey) ? this.state.googleMapsApiKey.trim() : undefined

    if (googleMapsApiKey) {
      try {
        await loadGoogleMapsClient(googleMapsApiKey)

        this.setState({
          // eslint-disable-next-line no-undef
          googleMapsClient: google,
          loadingGoogleMapsClient: false,
          submitting: false
        })
      } catch (err) {
        this.setState({
          error: err.toString(),
          loadingGoogleMapsClient: false,
          submitting: false
        })
      }
    } else {
      this.setState({
        error: 'Must provide a Google Maps API key.',
        loadingGoogleMapsClient: false
      })
    }
  }

  render () {
    const googleAPITooltip = 'Optionally, you can provide a valid Google Maps API key, which will enable the application to analyze the locations it finds. This key is never sent to any server other than the Google Maps API.<br/><br/>This might silently fail if the API key provided is invalid or for an account that does not have the Maps JavaScript API and Geocoding APIs enabled. Check the developer console if the Maps functionality does not work correctly after setting the API key.'
    return (
      <div className="container">
        {/* TOP NAV MENU */}
        <menu className="navbar-menu">
            <img id="logoImg" src={logoImg}/>
          <div id="userForm">
            <form onSubmit={e => { this.getUntappdOsint(e) }} disabled={this.state.submitting}>
              <input className="text-input" placeholder="Username" type="text" value={this.state.username} onChange={e => this.updateUsername(e) } />
              <label>Recent Activity <strong>only</strong></label>
              <input type="checkbox" value={this.state.recentActivityOnly} onChange={e => { this.updateRecentActivityOnly(e) }} />
              <input className="button" type="submit" value="Scrape" disabled={this.state.submitting} />
            </form>
          </div>
          <div id="mapsAPIForm">
            <form onSubmit={e => { this.setupGoogleMapsClient(e) }}>
               <input className="text-input" placeholder="Google Maps API Key" type="password" value={this.state.googleMapsApiKey} onChange={e => { this.updateGoogleMapsApiKey(e) }} readOnly={this.state.googleMapsClient} />
                <Tooltip title={googleAPITooltip} position="bottom" trigger="click">
                  <FontAwesomeIcon icon={faQuestionCircle}/>
                </Tooltip>
              <input className="button" type="submit" value="Set" disabled={this.state.loadingGoogleMapsClient || this.state.googleMapsClient} />
            </form>
          </div>
        </menu>
        <main className="content">
          {this.state.error &&
            <strong>{this.state.error}</strong>
          }
          {this.state.loading &&
            <div><img className="loadingBeer" src={LoadingIcon} alt="loadingIcon"/>
            <span>Scraping...</span></div>
          }
          {this.state.data && this.state.data.stats &&
            <Table title={`User Stats for ${this.state.data.username}`} data={[{...this.state.data.stats}]}/>
          }

          {this.state.data && this.state.data.recentActivity &&
            <Table title="Recent Activity" data={this.state.data.recentActivity} valueFormatter={params => {
              if(params.column.colId === 'time'){
                return params.value.format(timeFormat)
              }
            }}/>
          }

          {this.state.data && this.state.data.venues &&
            <Table title="Venues: " data={this.state.data.venues} valueFormatter={params => {
              const venue = params.data
              const columnName = params.column.colId
              if(columnName === 'address' && venue.geocode){
                return `${venue.geocode[0].geometry.location.lat()}, ${venue.geocode[0].geometry.location.lng()}`
              }
              return params.value
            }}/>
          }

          {this.state.data && this.state.data.beers &&
            <Table title="Beers:" data={this.state.data.beers} valueFormatter={params => {
              const columnName = params.column.colId
              if(columnName === 'firstDrinkTime') return params.value.format(timeFormat)
              if(columnName === 'lastDrinkTime') return params.value.format(timeFormat)
              return params.value
            }}/>
          }

          <div style={{ height: (this.state.data && this.state.data.map) ? '400px' : 0 }}>
            <div id="map"></div>
          </div>

          {this.state.data && this.state.data.beerAnalytics &&
            <div>
              {this.state.data && this.state.data.beerAnalytics.dayOfWeek &&
                  <Chart headerTitle="Drinking Patterns (Last 25 beers) - Day of Week:" data={makeChartData(this.state.data.beerAnalytics.dayOfWeek)} yRange={[0,25]}/>
              }

              {this.state.data && this.state.data.beerAnalytics.hourOfDay &&
                  <Chart headerTitle="Drinking Patterns (Last 25 beers) - Hour of Day:" data={makeChartData(mockData.beerAnalytics.hourOfDay)}/>
              }

              {this.state.data && this.state.data.beerAnalytics.dayOfMonth &&
                  <Chart headerTitle="Drinking Patterns (Last 25 beers) - Day of Month:" data={makeChartData(mockData.beerAnalytics.dayOfMonth)}/>
              }

              {this.state.data && this.state.data.beerAnalytics.binges &&

                <div className="bingesTable">
                  <header>
                    <h3>Binge Drink Periods (5+ drinks for men / 4+ drinks for women in &lt; 2 hours*):</h3>
                  </header>

                  <table>
                    <thead>
                      <tr>
                        <th>Start Time</th>
                        <th>End Time</th>
                        <th>Total Drinks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {this.state.data.beerAnalytics.binges.map((binge, index) =>
                        <tr key={index}>
                          <td>{binge[0].format(timeFormat)}</td>
                          <td>{binge[binge.length - 1].format(timeFormat)}</td>
                          <td>{binge.length}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              }

              {this.state.data && this.state.data.beerAnalytics.heavyUses &&
                <div className="heavyUsesTable">
                  <header>
                    <h3>Heavy Alcohol Uses (5+ instances of binge drinking in the past month):</h3>
                  </header>

                  <table>
                    <thead>
                      <tr>
                        <th>Start Time</th>
                        <th>End Time</th>
                        <th>Total Binges</th>
                      </tr>
                    </thead>
                    <tbody>
                      {this.state.data.beerAnalytics.heavyUses.map((heavyUse, index) =>
                        <tr key={index}>
                          <td>{heavyUse[0][0].format(timeFormat)}</td>
                          <td>{heavyUse[heavyUse.length - 1][heavyUse[heavyUse.length - 1].length - 1].format(timeFormat)}</td>
                          <td>{heavyUse.length}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              }

              {this.state.data && (this.state.data.beerAnalytics.binges || this.state.data.beerAnalytics.heavyUses) &&
                <p>
                  *<a href="https://www.niaaa.nih.gov/alcohol-health/overview-alcohol-consumption/moderate-binge-drinking"><em>Drinking Levels Definitions from the NIAAA</em></a>
                </p>
              }
            </div>
          }
        </main>
      </div>
    )
  }
}
