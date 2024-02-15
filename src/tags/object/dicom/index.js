import React from 'react'
import './index.css'
import {Provider} from 'react-redux'
import store from './store'
import { createMuiTheme, MuiThemeProvider } from '@material-ui/core/styles'
import DicomApp from "./App"
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

export const Dicom = () => {
    return (
        <Provider store={store}>
            <MuiThemeProvider theme = { theme }>
                <DicomApp />
            </MuiThemeProvider>
        </Provider>)
}


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
