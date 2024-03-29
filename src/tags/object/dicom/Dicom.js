import React, { Component } from 'react'
import './index.css'
import {Provider} from 'react-redux'
import store from './store'
import { createMuiTheme, MuiThemeProvider } from '@material-ui/core/styles'
import DicomApp from "./App"
import Registry from '../../../core/Registry';
import { inject } from 'mobx-react';
import { destroy, getRoot, getType, types } from 'mobx-state-tree';
import * as Tools from '../../../tools';
import { Toolbar } from '../../../components/Toolbar/Toolbar';
import ToolsManager from '../../../tools/Manager';
// import { create as WebFontLoader } from "mathjs"

// WebFontLoader.load({
//     google: {
//         families: ['Roboto:300,400,500,700', 'Material Icons'],
//     },
// })

store.subscribe(() => console.log('store updated:', store.getState()));

const theme = createMuiTheme({
    overrides: {
        MuiFormControlLabel: {
            label: {
                fontSize: '0.85em'
            },
        },
        MuiFormLabel: {
            root: {
                '&$focused': {
                    color:'#CCCCCC',
                },
            }

        }
    },
    palette: {
        primary: {
            main: '#030852',
        },
        secondary: {
            main: '#888888',
        },
        type: 'dark',
    },
  })

 class DicomView extends Component {
    renderTools() {
        const { item, store } = this.props;
        const cs = store.annotationStore;
  
        if (cs.viewingAllAnnotations || cs.viewingAllPredictions) return null;
        console.log("hree", this.props);
        const tools = item.getToolsManager().allTools();
  
        return (
          <Toolbar tools={tools} />
        );
      };

    render() {return (
        <Provider store={store}>
            <MuiThemeProvider theme = { theme }>
                <DicomApp />
                {this.renderTools()}
            </MuiThemeProvider>
        </Provider>)}
}



const Model = types.model({
  type: 'dicom',
  brushControl: types.optional(types.string, 'brush'),
  mode: types.optional(types.enumeration(['drawing', 'viewing', 'brush', 'eraser']), 'viewing'),
}).actions(self => {
    const manager = ToolsManager.getInstance({ name: self.name });
    function getToolsManager() {
        return manager;
      };

      return {
        getToolsManager
      }
});
const TagAttrs = types.model({
  value: types.maybeNull(types.string),
  valuelist: types.maybeNull(types.string),
  resize: types.maybeNull(types.number),
})

const DicomModel = types.compose(
    'DicomModel',
    TagAttrs,
    Model
  );
  
//   class DicomView extends React.Component {
//     render() {
//       return <iframe style={{height: "80vh", width:"87vw"}} src='https://dcm.5cnetwork.com'/>;
//     }
//   }
  
  const HtxDicom = inject('store')(DicomView);
  
  Registry.addTag('dicom', DicomModel, HtxDicom);
  Registry.addObjectType(DicomModel);
  
  export { DicomModel, HtxDicom };


// ReactDOM.render(
//     <Provider store={store}>
//         <MuiThemeProvider theme = { theme }>
//             <App />
//         </MuiThemeProvider>
//     </Provider>,
//     document.getElementById('root')
// )

// // If you want your app to work offline and load faster, you can change
// // unregister() to register() below. Note this comes with some pitfalls.
// // Learn more about service workers: https://bit.ly/CRA-PWA
// serviceWorker.register()


// import App from './App';
// import { inject } from "mobx-react"

// const DicomModel = types.compose(
//   'DicomModel',
//   TagAttrs,
//   ObjectBase,
//   ...(isFF(FF_LSDV_4583) ? [MultiItemObjectBase] : []),
//   AnnotationMixin,
//   IsReadyWithDepsMixin,
//   ImageEntityMixin,
//   Model,
//   isFF(FF_DEV_3793) ? CoordsCalculations : AbsoluteCoordsCalculations,
// );
//
// const HtxDicom = inject('store')(App);
//
// export { DicomModel, HtxDicom };
