// Copyright 2019 New Relic Corporation. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { Map, CircleMarker, TileLayer } from 'react-leaflet';
import {
  Spinner,
  Grid,
  GridItem,
  Stack,
  StackItem,
  AutoSizer,
  PlatformStateContext,
  NerdletStateContext,
  NerdGraphQuery,
  HeadingText,
  BlockText
} from 'nr1';
import { mapData, entityQuery, getMarkerColor } from './util';
import DetailsPanel from './details-panel';
import SummaryBar from '../../components/summary-bar';

export default class PageViewMap extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      detailsOpen: false,
      openedFacet: null,
      mapCenter: [39.8282, -98.5795],
      zoom: 8
    };

    this.togglePageViewDetails = this.togglePageViewDetails.bind(this);
  }

  togglePageViewDetails = (facet, center) => {
    if (facet) {
      this.setState({
        detailsOpen: true,
        openedFacet: facet,
        cityCode: facet.facet[0],
        stateCode: facet.facet[1],
        countryCode: facet.facet[2]
      });
      this.mapRef.leafletElement.flyTo(center, 10);
    } else {
      // debugger;
      this.setState({
        detailsOpen: false,
        openedFacet: null
      });
      this.mapRef.leafletElement.flyTo(this.state.mapCenter, 5);
    }
  };

  render() {
    const { detailsOpen, mapCenter, openedFacet } = this.state;
    return (
      <PlatformStateContext.Consumer>
        {launcherUrlState => (
          <NerdletStateContext.Consumer>
            {nerdletUrlState => (
              <AutoSizer>
                {({height, width}) => (<NerdGraphQuery query={entityQuery(nerdletUrlState.entityGuid)}>
                  {({ loading, error, data }) => {
                    if (loading) {
                      return <Spinner fillContainer />;
                    }

                    if (error) {
                      return (
                        <>
                          <HeadingText>An error ocurred</HeadingText>
                          <p>{error.message}</p>
                        </>
                      );
                    }

                    // console.debug(data);
                    const {
                      accountId,
                      servingApmApplicationId,
                      applicationId
                    } = data.actor.entity;
                    const appId = servingApmApplicationId || applicationId;
                    const { entity } = data.actor;
                    const { apdexTarget } = data.actor.entity.settings || 0.5;
                    // return "Hello";
                    return appId ? (
                      <NerdGraphQuery
                        query={mapData(accountId, appId, launcherUrlState)}
                      >
                        {({ loading, error, data }) => {
                          if (loading) {
                            return <Spinner fillContainer />;
                          }

                          if (error) {
                            return (
                              <>
                                <HeadingText>An error ocurred</HeadingText>
                                <p>{error.message}</p>
                              </>
                            );
                          }

                          // console.debug(data);
                          const { results } = data.actor.account.mapData;
                          return (
                            <Stack
                              fullWidth
                              horizontalType={Stack.HORIZONTAL_TYPE.FILL}
                              directionType={Stack.DIRECTION_TYPE.VERTICAL}
                              gapType={Stack.GAP_TYPE.TIGHT}
                              verticalType={Stack.VERTICAL_TYPE.FILL}
                              //preview
                            >
                              {/*}
                              <StackItem shrink={true}>
                              <h2 id="prototype">This Nerdlet is an active prototype meant to demonstrate capabilities and help refine requirements.</h2>
                              </StackItem>
                              {*/}
                              <StackItem shrink={true}>
                                <SummaryBar appName={entity.name} accountId={accountId} launcherUrlState={launcherUrlState} />
                              </StackItem>
                              <StackItem>
                                <Grid
                                  spacingType={[
                                    Grid.SPACING_TYPE.NONE,
                                    Grid.SPACING_TYPE.NONE
                                  ]}
                                >
                                  <GridItem columnSpan={detailsOpen ? 8 : 12}>
                                    <Map
                                      className="containerMap"
                                      style={{height: `${height-130}px`}}
                                      center={mapCenter}
                                      zoom={5}
                                      zoomControl
                                      ref={ref => {
                                        this.mapRef = ref;
                                      }}
                                    >
                                      {/* See more map overlays at: http://leaflet-extras.github.io/leaflet-providers/preview/*/}
                                      {/*}
                                      <TileLayer
                                        attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                      />
                                    {*/}
                                      <TileLayer
                                            attribution='Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012'
                                            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
                                      />
                                      {results.map((pt, i) => {
                                        const center = [pt.lat, pt.lng];
                                        return (
                                          <CircleMarker
                                            key={`circle-${i}`}
                                            center={center}
                                            color={getMarkerColor(pt.y, apdexTarget)}
                                            radius={Math.log(pt.x) * 3}
                                            onClick={() => {
                                              this.togglePageViewDetails(pt, center);
                                            }}
                                          />
                                        );
                                      })}
                                    </Map>
                                  </GridItem>
                                  {openedFacet && (
                                    <GridItem columnSpan={4}>
                                      <DetailsPanel
                                        appId={appId}
                                        accountId={accountId}
                                        openedFacet={openedFacet}
                                        launcherUrlState={launcherUrlState}
                                        togglePageViewDetails={
                                          this.togglePageViewDetails
                                        }
                                      />
                                    </GridItem>
                                  )}
                                </Grid>
                              </StackItem>
                            </Stack>
                          );
                        }}
                      </NerdGraphQuery>
                    ) : (
                      <div style={{ width: '50%', margin: 'auto' }}>
                        <HeadingText>
                          No location data is available for this app
                        </HeadingText>
                        <BlockText>
                          {entity.name} does not have PageView events with an
                          associated appId.
                        </BlockText>
                      </div>
                    );
                  }}
              </NerdGraphQuery>)}
              </AutoSizer>
            )}
          </NerdletStateContext.Consumer>
        )}
      </PlatformStateContext.Consumer>
    );
  }
}