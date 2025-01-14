import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import AccessibilitySettings from '~/client/components/AccessibilitySettings';
import ColorSection from '~/client/components/ColorSection';
import notify from '~/client/store/notifications/actions';
import styles from '~/client/styles/variables';
import translate from '~/common/services/i18n';
import { BackgroundAreaStyle } from '~/client/styles/layout';
import {
  ParagraphStyle,
  HeadingSecondaryStyle,
} from '~/client/styles/typography';
import { resetToken } from '~/client/store/app/actions';
import { usePaginatedResource } from '~/client/hooks/requests';

const Navigation = ({ onClickItem, isExpanded }) => {
  const { isAuthenticated, isAlternateColor } = useSelector(
    (state) => state.app,
  );

  const [festivals] = usePaginatedResource(['festivals']);

  return (
    <NavigationStyle
      isAlternateColor={isAlternateColor}
      isExpanded={isExpanded}
    >
      <ColorSection isInverted>
        <NavigationMenuStyle>
          <NavigationMenuItemStyle>
            <HeadingSecondaryStyle>
              {translate('Navigation.titleFestivals')}
            </HeadingSecondaryStyle>
          </NavigationMenuItemStyle>

          {festivals &&
            festivals.map((festival) => {
              return (
                <NavigationMenuItemStyle key={festival.id}>
                  <NavigationLink
                    to={`/festivals/${festival.slug}`}
                    onClick={onClickItem}
                  >
                    <ParagraphStyle>{festival.title}</ParagraphStyle>
                  </NavigationLink>
                </NavigationMenuItemStyle>
              );
            })}
        </NavigationMenuStyle>

        {isAuthenticated ? (
          <NavigationMenuStyle>
            <NavigationMenuItemStyle>
              <HeadingSecondaryStyle>
                {translate('Navigation.titleAdmin')}
              </HeadingSecondaryStyle>
            </NavigationMenuItemStyle>

            <NavigationMenuItemStyle>
              <NavigationLink to="/admin" onClick={onClickItem}>
                <ParagraphStyle>
                  {translate('Navigation.linkAdminDashboard')}
                </ParagraphStyle>
              </NavigationLink>
            </NavigationMenuItemStyle>

            <NavigationMenuItemStyle>
              <NavigationLink to="/admin/users" onClick={onClickItem}>
                <ParagraphStyle>
                  {translate('Navigation.linkAdminUsers')}
                </ParagraphStyle>
              </NavigationLink>
            </NavigationMenuItemStyle>

            <NavigationMenuItemStyle>
              <NavigationLink to="/admin/festivals" onClick={onClickItem}>
                <ParagraphStyle>
                  {translate('Navigation.linkAdminFestivals')}
                </ParagraphStyle>
              </NavigationLink>
            </NavigationMenuItemStyle>

            <NavigationMenuItemStyle>
              <NavigationLink to="/admin/booths" onClick={onClickItem}>
                <ParagraphStyle>
                  {translate('Navigation.linkAdminBooths')}
                </ParagraphStyle>
              </NavigationLink>
            </NavigationMenuItemStyle>

            <NavigationMenuItemStyle>
              <NavigationLink to="/admin/artists" onClick={onClickItem}>
                <ParagraphStyle>
                  {translate('Navigation.linkAdminArtists')}
                </ParagraphStyle>
              </NavigationLink>
            </NavigationMenuItemStyle>

            <NavigationMenuItemStyle>
              <NavigationLink to="/admin/artworks" onClick={onClickItem}>
                <ParagraphStyle>
                  {translate('Navigation.linkAdminArtworks')}
                </ParagraphStyle>
              </NavigationLink>
            </NavigationMenuItemStyle>

            <NavigationMenuItemStyle>
              <NavigationLink to="/admin/organisations" onClick={onClickItem}>
                <ParagraphStyle>
                  {translate('Navigation.linkAdminOrganisations')}
                </ParagraphStyle>
              </NavigationLink>
            </NavigationMenuItemStyle>

            <NavigationMenuItemStyle>
              <NavigationLink to="/admin/properties" onClick={onClickItem}>
                <ParagraphStyle>
                  {translate('Navigation.linkAdminProperties')}
                </ParagraphStyle>
              </NavigationLink>
            </NavigationMenuItemStyle>

            <NavigationMenuItemStyle>
              <NavigationLink to="/admin/questions" onClick={onClickItem}>
                <ParagraphStyle>
                  {translate('Navigation.linkAdminQuestions')}
                </ParagraphStyle>
              </NavigationLink>
            </NavigationMenuItemStyle>

            <NavigationMenuItemStyle>
              <NavigationLogoutButton onClick={onClickItem}>
                <ParagraphStyle>
                  {translate('Navigation.linkAdminSignOut')}
                </ParagraphStyle>
              </NavigationLogoutButton>
            </NavigationMenuItemStyle>
          </NavigationMenuStyle>
        ) : null}
      </ColorSection>

      <ColorSection>
        <NavigationAccessibilityStyle>
          <HeadingSecondaryStyle>
            {translate('Navigation.titleAccessibility')}
          </HeadingSecondaryStyle>

          <AccessibilitySettings />
        </NavigationAccessibilityStyle>
      </ColorSection>
    </NavigationStyle>
  );
};

const NavigationLogoutButton = (props) => {
  const dispatch = useDispatch();

  const onClick = () => {
    dispatch(resetToken());

    dispatch(
      notify({
        text: translate('Navigation.notificationSignOutSuccess'),
      }),
    );

    props.onClick('/');
  };

  return (
    <Link to="/" onClick={onClick}>
      {props.children}
    </Link>
  );
};

const NavigationLink = (props) => {
  const onClick = () => {
    props.onClick(props.to);
  };

  return (
    <Link to={props.to} onClick={onClick}>
      {props.children}
    </Link>
  );
};

Navigation.propTypes = {
  isExpanded: PropTypes.bool.isRequired,
  onClickItem: PropTypes.func.isRequired,
};

NavigationLink.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func.isRequired,
  to: PropTypes.string.isRequired,
};

NavigationLogoutButton.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func.isRequired,
};

const NavigationStyle = styled(BackgroundAreaStyle)`
  position: fixed;

  top: 0;
  right: 0;
  bottom: 0;
  left: 0;

  z-index: ${styles.layers.Navigation};

  visibility: ${(props) => (props.isExpanded ? 'visible' : 'hidden')};

  overflow-x: hidden;
  overflow-y: auto;
`;

const NavigationAccessibilityStyle = styled(BackgroundAreaStyle)`
  padding: ${styles.layout.spacing};
  padding-bottom: 4rem;

  text-align: center;

  justify-content: center;

  h2 {
    margin-top: ${styles.layout.spacing};
    margin-bottom: ${styles.layout.spacing};

    color: ${styles.colors.violet};
  }
`;

const NavigationMenuStyle = styled.ul`
  margin: 0;
  padding: ${styles.layout.spacing};
  padding-top: 4rem;

  list-style: none;
`;

const NavigationMenuItemStyle = styled.li`
  margin-bottom: 1rem;

  font-family: ${styles.typography.familyHeading};

  text-align: center;

  a {
    @media ${styles.media.tablet} {
      font-size: 2em;
    }

    @media ${styles.media.desktop} {
      font-size: 3em;
    }

    font-size: 1.5em;
  }

  h2 {
    margin: 0;
    padding: 0;
  }
`;

export default Navigation;
